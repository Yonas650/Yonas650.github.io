import ErrorIcon from './icons/ErrorIcon';
import WarningIcon from './icons/WarningIcon';
import BellIcon from './icons/BellIcon';
import GithubIcon from './icons/GithubIcon';
import LinkedinIcon from './icons/LinkedinIcon';
// ScholarIcon can be removed if you do not have a Google Scholar profile.
// import ScholarIcon from './icons/ScholarIcon';
import SourceControlIcon from './icons/SourceControlIcon';
import styles from '../styles/Bottombar.module.css';

const Bottombar = () => {
  return (
    <footer className={styles.bottomBar}>
      <div className={styles.container}>
        <a
          href="https://github.com/Yonas650" // Update with your GitHub profile or repository URL
          target="_blank"
          rel="noreferrer noopener"
          className={styles.section}
        >
          <SourceControlIcon className={styles.icon} />
          <p>main</p>
        </a>
        <div className={styles.section}>
          <ErrorIcon className={styles.icon} />
          <p className={styles.errorText}>0</p>&nbsp;&nbsp;
          <WarningIcon className={styles.icon} />
          <p>0</p>
        </div>
      </div>
      <div className={styles.container}>
        <a href="https://www.linkedin.com/in/yonas-atinafu-b35921372/" target="_blank" rel="noopener noreferrer">
          <div className={styles.section}>
            <LinkedinIcon className={styles.icon} />
            <p>Linkedin</p>
          </div>
        </a>
        <a href="https://github.com/Yonas650" target="_blank" rel="noopener">
          <div className={styles.section}>
            <GithubIcon className={styles.icon} />
            <p>Github</p>
          </div>
        </a>
        {/* Remove or comment out the Scholar link if not needed */}
        {/* <a href="Your Google Scholar Profile Link" target="_blank" rel="noopener">
          <div className={styles.section}>
            <ScholarIcon className={styles.icon} />
            <p>Scholar</p>
          </div>
        </a> */}
        {/* If you have other links or social icons to add, you can do so here */}
        <div className={styles.section}>
          <BellIcon />
        </div>
      </div>
    </footer>
  );
};

export default Bottombar;
