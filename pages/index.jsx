import Link from 'next/link';
// import Illustration from '../components/Illustration';
import Image from "next/image";
import styles from '../styles/HomePage.module.css';

export default function HomePage() {
  return (
    <>
      <div className={styles.container}>
        <div className={styles.background}>
          <h1>AI</h1>
          <h1>ML</h1>
          <h1>Software</h1>
        </div>
        <div className={styles.foreground}>
          <div className={styles.content}>
            <h1 className={styles.name}>Yonas Atinafu</h1>
            <h6 className={styles.bio}>Aspiring Machine Learning Engineer | Software Developer</h6>
            <div className={styles.cardContainer}>
              <div className={styles.card}>
                <div className={styles.content}>
                  <h4>Skill Set</h4>
                  <div className={styles.tags}>
                    <span key='Python' className='Python'>
                      Python
                    </span>
                    <span key='Research' className='Research'>
                    Research
                    </span>
                    <span key='Generative AI' className='Generative AI'>
                    Generative AI
                    </span>
                    <span key='JavaScript' className='JavaScript'>
                      JavaScript
                    </span>
                    <span key='React' className='React'>
                      React
                    </span>
                    <span key='NodeJS' className='NodeJS'>
                      Node.js
                    </span>
                    <span key='Tensorflow' className='Tensorflow'>
                      TensorFlow
                    </span>
                    <span key='PyTorch' className='PyTorch'>
                      PyTorch
                    </span>
                    <span key='Machine-Learning' className='Machine-Learning'>
                      Machine-Learning
                    </span>
                    <span key='Computer-Vision' className='Computer-Vision'>
                      Computer-Vision
                    </span>
                    <span key='Data-Science' className='Data-Science'>
                      Data-Science
                    </span>
                    <span key='SQL' className='SQL'>
                      SQL
                    </span>
                    <span key='Software-Engineering' className='Software-Engineering'>
                    Software-Engineering
                    </span>
                    <span key='MongoDB' className='MongoDB'>
                     MongoDB
                    </span>
                    <span key='APIs' className='APIs'>
                      APIs
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <Link href="/about">
              <button className={styles.button}>About Me</button>
            </Link>
            {/* <Link href="/projects">
              <button className={styles.button}>View Projects</button>
            </Link> */}
            <Link href="/contact">
              <button className={styles.outlined}>Contact</button>
            </Link>
          </div>
          {/* <Illustration className={styles.illustration} /> */}
          <div className={styles.right}>
            <div className={styles.picture_boader}>
              <Image
                className={styles.picture}
                src="/me.jpeg"
                width={300}
                height={290}
                alt="Kostas' Picture"
              />
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

export async function getStaticProps() {
  return {
    props: { title: 'Home' },
  };
}
