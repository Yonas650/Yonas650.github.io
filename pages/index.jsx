import Link from 'next/link';
import Image from 'next/image';
import styles from '../styles/HomePage.module.css';

const quickFacts = ['Waterloo', 'SWE + ML', 'Research + Product'];

const stack = [
  { key: 'Python', label: 'Python', className: 'Python' },
  { key: 'Research', label: 'Research', className: 'Research' },
  { key: 'Generative AI', label: 'Generative AI', className: 'Generative-AI' },
  { key: 'JavaScript', label: 'JavaScript', className: 'JavaScript' },
  { key: 'React', label: 'React', className: 'React' },
  { key: 'Node.js', label: 'Node.js', className: 'NodeJS' },
  { key: 'TensorFlow', label: 'TensorFlow', className: 'Tensorflow' },
  { key: 'PyTorch', label: 'PyTorch', className: 'PyTorch' },
  { key: 'Machine-Learning', label: 'Machine Learning', className: 'Machine-Learning' },
  { key: 'Computer-Vision', label: 'Computer Vision', className: 'Computer-Vision' },
  { key: 'Data-Science', label: 'Data Science', className: 'Data-Science' },
  { key: 'SQL', label: 'SQL', className: 'SQL' },
  { key: 'Software-Engineering', label: 'Software Engineering', className: 'Software-Engineering' },
  { key: 'MongoDB', label: 'MongoDB', className: 'MongoDB' },
  { key: 'APIs', label: 'APIs', className: 'APIs' },
];

export default function HomePage() {
  return (
    <section className={styles.container}>
      <div className={styles.background} aria-hidden="true">
        <h1>WELCOME</h1>
        <h1>home.jsx</h1>
      </div>

      <p className={styles.editorHint}>OPEN EDITOR • home.jsx</p>

      <div className={styles.foreground}>
        <article className={styles.heroPanel}>
          <div className={styles.panelTop}>
            <span></span>
            <span></span>
            <span></span>
            <p>README.md</p>
          </div>

          <h1 className={styles.name}>Yonas Atinafu</h1>
          <p className={styles.bio}>Software Developer · Machine Learning Engineer</p>
          <p className={styles.summary}>
            Building production AI systems, research prototypes, and full-stack
            software with a focus on reliability, speed, and practical impact.
          </p>

          <div className={styles.quickMeta}>
            {quickFacts.map((fact) => (
              <span key={fact}>{fact}</span>
            ))}
          </div>

          <div className={styles.actions}>
            <Link href="/projects">
              <a className={styles.button}>View Projects</a>
            </Link>
            <Link href="/about">
              <a className={styles.outlined}>About Me</a>
            </Link>
            <Link href="/contact">
              <a className={styles.outlinedMuted}>Contact</a>
            </Link>
          </div>
        </article>

        <aside className={styles.sideCard}>
          <div className={styles.pictureBorder}>
            <Image
              className={styles.picture}
              src="/me.jpeg"
              width={320}
              height={320}
              alt="Portrait of Yonas Atinafu"
              priority
            />
          </div>

          <div className={styles.sideContent}>
            <h3>Skill Stack</h3>
            <div className={styles.tags}>
              {stack.map((item) => (
                <span key={item.key} className={item.className}>
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export async function getStaticProps() {
  return {
    props: { title: 'Home' },
  };
}
