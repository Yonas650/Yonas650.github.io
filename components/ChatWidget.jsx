import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/ChatWidget.module.css';

const CHAT_STORAGE_KEY = 'yonas_chat_history_v1';
const SESSION_STORAGE_KEY = 'yonas_chat_session_v1';
const POSITION_STORAGE_KEY = 'yonas_chat_position_v1';

const CLIENT_WINDOW_MS = 60 * 1000;
const CLIENT_MAX_REQUESTS = 8;
const REQUEST_TIMEOUT_MS = 65 * 1000;
const MAX_PERSISTED_MESSAGES = 30;

const QUICK_ACTIONS = [
  { label: 'Projects', prompt: 'What are Yonas\' strongest recent projects?' },
  { label: 'Research', prompt: 'Summarize Yonas\' research focus and current work.' },
  { label: 'Contact', prompt: 'How can I contact Yonas for collaboration?' },
  { label: 'Resume', prompt: 'Can you summarize Yonas\' resume highlights?' },
];

const EMAIL_REGEX = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

const DEFAULT_MESSAGES = [
  {
    id: 'welcome',
    role: 'assistant',
    content:
      'Hi, I\'m Yonas\' site assistant. Ask about projects, research, experience, or contact details.',
    sources: [],
  },
];

function randomId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
}

function clamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function sanitizeMessage(input) {
  return String(input || '').replace(/\s+/g, ' ').trim();
}

function pickEmail(input) {
  const match = sanitizeMessage(input).match(EMAIL_REGEX);
  return match ? match[0] : '';
}

function normalizeBaseUrl(value) {
  return String(value || '').replace(/\/+$/, '');
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export default function ChatWidget() {
  const router = useRouter();
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const streamTimerRef = useRef(null);
  const dragStateRef = useRef(null);
  const clientHitsRef = useRef([]);

  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [messages, setMessages] = useState(DEFAULT_MESSAGES);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [errorBanner, setErrorBanner] = useState(null);
  const [retryPayload, setRetryPayload] = useState(null);
  const [position, setPosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [leadFlow, setLeadFlow] = useState({
    stage: 'idle',
    email: '',
    name: '',
    notes: '',
  });

  const apiBaseUrl = useMemo(
    () =>
      normalizeBaseUrl(
        process.env.CHATBOT_API_BASE_URL ||
          process.env.NEXT_PUBLIC_CHATBOT_API_BASE_URL ||
          ''
      ),
    []
  );

  useEffect(() => {
    setHydrated(true);

    if (typeof window === 'undefined') {
      return;
    }

    const persisted = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (persisted) {
      try {
        const parsed = JSON.parse(persisted);
        if (Array.isArray(parsed) && parsed.length) {
          setMessages(parsed.slice(-MAX_PERSISTED_MESSAGES));
        }
      } catch (_error) {
        // Ignore malformed storage.
      }
    }

    const savedSession = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (savedSession) {
      setSessionId(savedSession);
    } else {
      const generated = randomId('session');
      setSessionId(generated);
      window.localStorage.setItem(SESSION_STORAGE_KEY, generated);
    }

    const savedPosition = window.localStorage.getItem(POSITION_STORAGE_KEY);
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition);
        if (
          parsed &&
          Number.isFinite(parsed.x) &&
          Number.isFinite(parsed.y)
        ) {
          setPosition(parsed);
        }
      } catch (_error) {
        // Ignore malformed storage.
      }
    }

    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const updateMobile = () => {
      setIsMobile(mediaQuery.matches);
    };

    updateMobile();
    mediaQuery.addEventListener('change', updateMobile);

    return () => {
      mediaQuery.removeEventListener('change', updateMobile);
    };
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(
      CHAT_STORAGE_KEY,
      JSON.stringify(messages.slice(-MAX_PERSISTED_MESSAGES))
    );
  }, [messages, hydrated]);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') {
      return;
    }
    if (!position || isMobile) {
      return;
    }
    window.localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position));
  }, [position, hydrated, isMobile]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        return;
      }

      if (event.key === '/' && isOpen) {
        const target = event.target;
        const tag = target && target.tagName ? target.tagName.toLowerCase() : '';
        const typing = tag === 'input' || tag === 'textarea' || target?.isContentEditable;
        if (!typing) {
          event.preventDefault();
          inputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (streamTimerRef.current) {
        clearTimeout(streamTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    inputRef.current?.focus();
  }, [isOpen]);

  const currentPageUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return router.asPath || null;
    }
    return window.location.href;
  }, [router.asPath]);

  const updateMessage = (id, content) => {
    setMessages((prev) =>
      prev.map((item) => (item.id === id ? { ...item, content } : item))
    );
  };

  const streamAssistantMessage = async (content, sources = []) => {
    const clean = sanitizeMessage(content);
    const message = {
      id: randomId('assistant'),
      role: 'assistant',
      content: '',
      sources,
    };
    setMessages((prev) => [...prev, message]);

    const chars = Array.from(clean);
    const step = Math.max(2, Math.ceil(chars.length / 80));

    return new Promise((resolve) => {
      let cursor = 0;
      const tick = () => {
        cursor = Math.min(chars.length, cursor + step);
        updateMessage(message.id, chars.slice(0, cursor).join(''));

        if (cursor < chars.length) {
          streamTimerRef.current = setTimeout(tick, 16);
          return;
        }

        streamTimerRef.current = null;
        resolve();
      };

      tick();
    });
  };

  const resolveSourceHref = (url) => {
    if (!url) {
      return '#';
    }
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    if (typeof window === 'undefined') {
      return url;
    }
    if (url.startsWith('/')) {
      return `${window.location.origin}${url}`;
    }
    return `${window.location.origin}/${url.replace(/^\.\//, '')}`;
  };

  const checkClientRateLimit = () => {
    const now = Date.now();
    clientHitsRef.current = clientHitsRef.current.filter(
      (item) => now - item < CLIENT_WINDOW_MS
    );

    if (clientHitsRef.current.length >= CLIENT_MAX_REQUESTS) {
      return false;
    }

    clientHitsRef.current.push(now);
    return true;
  };

  const toHistoryPayload = (fullMessages) => {
    return fullMessages
      .filter((item) => item.role === 'user' || item.role === 'assistant')
      .map((item) => ({
        role: item.role,
        content: sanitizeMessage(item.content),
      }))
      .filter((item) => item.content)
      .slice(-14);
  };

  const requestChat = async (payload) => {
    if (!apiBaseUrl) {
      setErrorBanner({
        kind: 'error',
        message:
          'Chatbot backend URL is not configured. Set CHATBOT_API_BASE_URL and rebuild.',
      });
      await streamAssistantMessage(
        'Chatbot backend is not configured yet. Please set CHATBOT_API_BASE_URL and redeploy the site.'
      );
      return;
    }

    setErrorBanner(null);
    setRetryPayload(payload);
    setIsPending(true);

    try {
      const response = await fetchWithTimeout(
        `${apiBaseUrl}/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(sessionId ? { 'x-session-id': sessionId } : {}),
          },
          body: JSON.stringify(payload),
        },
        REQUEST_TIMEOUT_MS
      );

      let body = null;
      try {
        body = await response.json();
      } catch (_error) {
        body = null;
      }

      if (!response.ok) {
        const detail = body?.detail || {};
        const errorCode = detail.error || '';
        const message = detail.message || 'Request failed. Please retry.';

        if (
          response.status >= 500 ||
          errorCode === 'warming_up' ||
          errorCode === 'overloaded' ||
          errorCode === 'timeout'
        ) {
          setErrorBanner({
            kind: 'warming',
            message: 'Warming up… model cold-start in progress.',
          });
          return;
        }

        if (response.status === 429 || errorCode === 'rate_limited') {
          setErrorBanner({
            kind: 'rate',
            message,
          });
          await streamAssistantMessage(message);
          return;
        }

        setErrorBanner({ kind: 'error', message });
        await streamAssistantMessage(message);
        return;
      }

      const reply = sanitizeMessage(body?.reply || '');
      const sources = Array.isArray(body?.sources)
        ? body.sources
            .filter((item) => item && item.title && item.url)
            .slice(0, 4)
            .map((item) => ({ title: item.title, url: item.url }))
        : [];

      setErrorBanner(null);
      setRetryPayload(null);

      if (!reply) {
        await streamAssistantMessage(
          'I don\'t know based on the current site content. If you\'d like, share your email and I can follow up.'
        );
        return;
      }

      await streamAssistantMessage(reply, sources);
    } catch (error) {
      if (error.name === 'AbortError') {
        setErrorBanner({
          kind: 'warming',
          message: 'Warming up… request timed out, retry when ready.',
        });
        return;
      }

      setErrorBanner({
        kind: 'warming',
        message: 'Warming up… temporary backend issue.',
      });
    } finally {
      setIsPending(false);
    }
  };

  const submitLead = async (lead) => {
    if (!apiBaseUrl) {
      await streamAssistantMessage(
        'I captured your details locally, but lead submission is not configured yet.'
      );
      return;
    }

    try {
      const response = await fetchWithTimeout(
        `${apiBaseUrl}/lead`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(lead),
        },
        20000
      );

      if (!response.ok) {
        await streamAssistantMessage(
          'I could not submit your contact details right now. Please try again in a moment.'
        );
        return;
      }

      await streamAssistantMessage(
        'Thanks. I sent your details through and Yonas can follow up by email.'
      );
    } catch (_error) {
      await streamAssistantMessage(
        'I could not submit your contact details right now. Please try again in a moment.'
      );
    }
  };

  const openAndPrompt = async (prompt) => {
    setIsOpen(true);
    setInput('');
    await handleUserPrompt(prompt);
  };

  const handleUserPrompt = async (rawValue) => {
    const clean = sanitizeMessage(rawValue);
    if (!clean || isPending) {
      return;
    }

    if (!checkClientRateLimit()) {
      setErrorBanner({
        kind: 'rate',
        message: 'You are sending messages too quickly. Please wait a moment.',
      });
      await streamAssistantMessage(
        'Rate limit reached on this device. Please wait about a minute and retry.'
      );
      return;
    }

    const userMessage = {
      id: randomId('user'),
      role: 'user',
      content: clean,
      sources: [],
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);

    if (leadFlow.stage === 'need_name') {
      const name = clean.slice(0, 120);
      setLeadFlow((prev) => ({ ...prev, stage: 'need_notes', name }));
      await streamAssistantMessage(
        'Thanks. Add a short note about what you\'d like to discuss (or say "skip").'
      );
      return;
    }

    if (leadFlow.stage === 'need_notes') {
      const notes = clean.toLowerCase() === 'skip' ? '' : clean.slice(0, 1000);
      const leadPayload = {
        email: leadFlow.email,
        name: leadFlow.name || null,
        notes: notes || null,
        page_url: currentPageUrl || null,
      };

      setLeadFlow({
        stage: 'done',
        email: leadFlow.email,
        name: leadFlow.name,
        notes,
      });

      setIsPending(true);
      await submitLead(leadPayload);
      setIsPending(false);

      setLeadFlow({ stage: 'idle', email: '', name: '', notes: '' });
      return;
    }

    const detectedEmail = pickEmail(clean);
    if (detectedEmail) {
      setLeadFlow({
        stage: 'need_name',
        email: detectedEmail,
        name: '',
        notes: '',
      });
      await streamAssistantMessage(
        'Thanks for sharing your email. What name should I include for the follow-up?'
      );
      return;
    }

    const payload = {
      message: clean,
      history: toHistoryPayload(nextMessages),
      page_url: currentPageUrl || null,
    };

    await requestChat(payload);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const clean = sanitizeMessage(input);
    if (!clean) {
      return;
    }
    setInput('');
    await handleUserPrompt(clean);
  };

  const handleRetry = async () => {
    if (!retryPayload || isPending) {
      return;
    }
    await requestChat(retryPayload);
  };

  const startDrag = (event) => {
    if (isMobile || !isOpen || !panelRef.current) {
      return;
    }

    const rect = panelRef.current.getBoundingClientRect();
    dragStateRef.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };

    setIsDragging(true);
    event.preventDefault();
  };

  useEffect(() => {
    const onMove = (event) => {
      if (!dragStateRef.current || isMobile) {
        return;
      }

      const margin = 8;
      const nextX = clamp(
        event.clientX - dragStateRef.current.offsetX,
        margin,
        window.innerWidth - dragStateRef.current.width - margin
      );
      const nextY = clamp(
        event.clientY - dragStateRef.current.offsetY,
        margin,
        window.innerHeight - dragStateRef.current.height - margin
      );

      setPosition({ x: nextX, y: nextY });
    };

    const onUp = () => {
      dragStateRef.current = null;
      setIsDragging(false);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isMobile]);

  const panelStyle = !isMobile && position
    ? {
        left: `${position.x}px`,
        top: `${position.y}px`,
        right: 'auto',
        bottom: 'auto',
      }
    : undefined;

  return (
    <div className={styles.root} aria-live="polite">
      <button
        type="button"
        className={`${styles.launcher} ${isOpen ? styles.launcherOpen : ''}`}
        aria-label={isOpen ? 'Close assistant' : 'Open assistant'}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className={styles.launcherPulse} />
        <span className={styles.launcherGlyph}>{isOpen ? '×' : 'AI'}</span>
      </button>

      <section
        ref={panelRef}
        className={`${styles.panel} ${isOpen ? styles.panelOpen : styles.panelClosed}`}
        style={panelStyle}
        aria-hidden={!isOpen}
      >
        <header
          className={`${styles.header} ${isDragging ? styles.headerDragging : ''}`}
          onMouseDown={startDrag}
        >
          <div>
            <h3>Portfolio Concierge</h3>
            <p>Ask about projects, research, and collaboration.</p>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => setIsOpen(false)}
            aria-label="Close assistant"
          >
            ×
          </button>
        </header>

        {errorBanner ? (
          <div
            className={`${styles.banner} ${
              errorBanner.kind === 'warming'
                ? styles.bannerWarming
                : errorBanner.kind === 'rate'
                ? styles.bannerRate
                : styles.bannerError
            }`}
          >
            <span>{errorBanner.message}</span>
            {errorBanner.kind === 'warming' && retryPayload ? (
              <button
                type="button"
                onClick={handleRetry}
                disabled={isPending}
                className={styles.retryButton}
              >
                Retry
              </button>
            ) : null}
          </div>
        ) : null}

        <div className={styles.quickActions}>
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              className={styles.chip}
              onClick={() => openAndPrompt(action.prompt)}
              disabled={isPending}
            >
              {action.label}
            </button>
          ))}
        </div>

        <div className={styles.messages}>
          {messages.map((message) => (
            <article
              key={message.id}
              className={`${styles.message} ${
                message.role === 'assistant' ? styles.assistant : styles.user
              }`}
            >
              <p>{message.content}</p>
              {message.role === 'assistant' && message.sources?.length ? (
                <div className={styles.sources}>
                  {message.sources.map((source) => (
                    <a
                      key={`${source.title}-${source.url}`}
                      href={resolveSourceHref(source.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {source.title}
                    </a>
                  ))}
                </div>
              ) : null}
            </article>
          ))}

          {isPending ? (
            <article className={`${styles.message} ${styles.assistant}`}>
              <div className={styles.typing}>
                <span />
                <span />
                <span />
              </div>
            </article>
          ) : null}
        </div>

        <form className={styles.inputForm} onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              isPending
                ? 'Waiting for response...'
                : leadFlow.stage === 'need_name'
                ? 'Enter your name'
                : leadFlow.stage === 'need_notes'
                ? 'Add a short note (or type skip)'
                : 'Type a message... (/ to focus, Esc to close)'
            }
            disabled={isPending}
            maxLength={1800}
          />
          <button type="submit" disabled={isPending || !sanitizeMessage(input)}>
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
