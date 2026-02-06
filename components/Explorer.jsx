import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/router';
import ChevronRight from '../components/icons/ChevronRight';
import styles from '../styles/Explorer.module.css';

const explorerItems = [
  {
    name: 'home.jsx',
    path: '/',
    icon: 'react_icon.svg',
  },
  {
    name: 'about.html',
    path: '/about',
    icon: 'html_icon.svg',
  },
  {
    name: 'contact.yml',
    path: '/contact',
    icon: 'yml_icon.svg',
  },
  {
    name: 'projects.py',
    path: '/projects',
    icon: 'py_icon.svg',
  },
  {
    name: 'papers.json',
    path: '/papers',
    icon: 'json_icon.svg',
  },
  {
    name: 'github.md',
    path: '/github',
    icon: 'markdown_icon.svg',
  },
  {
    name: 'resume.pdf',
    path: '/resume',
    icon: 'pdf_icon.svg',
  },
];

const Explorer = () => {
  const [portfolioOpen, setPortfolioOpen] = useState(true);
  const router = useRouter();

  return (
    <aside className={styles.explorer}>
      <p className={styles.title}>Explorer</p>
      <div>
        <button
          type="button"
          className={styles.heading}
          onClick={() => setPortfolioOpen((open) => !open)}
          aria-expanded={portfolioOpen}
          aria-controls="portfolio-files"
        >
          <ChevronRight
            className={styles.chevron}
            style={portfolioOpen ? { transform: 'rotate(90deg)' } : undefined}
          />
          Portfolio
        </button>
        <div
          id="portfolio-files"
          className={`${styles.files} ${portfolioOpen ? '' : styles.filesHidden}`}
        >
          {explorerItems.map((item) => {
            const isActive = router.pathname === item.path;

            return (
              <Link href={item.path} key={item.name}>
                <a
                  className={`${styles.file} ${isActive ? styles.fileActive : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Image
                    src={`/${item.icon}`}
                    alt={item.name}
                    height={16}
                    width={16}
                  />
                  <p>{item.name}</p>
                </a>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default Explorer;
