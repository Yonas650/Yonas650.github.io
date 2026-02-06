import WatchIcon from '../components/icons/WatchIcon';
import ForkIcon from '../components/icons/ForkIcon';
import StarIcon from '../components/icons/StarIcon';
import GithubIcon from '../components/icons/GithubIcon';
import LinkIcon from '../components/icons/LinkIcon';
import styles from '../styles/RepoCard.module.css';

const RepoCard = ({ repo }) => {
  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <h3 className={styles.title}>{repo.name}</h3>
        <div className={styles.actions}>
          <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
            <GithubIcon height={20} width={20} className={styles.icon} />
          </a>
          {repo.homepage && (
            <a href={repo.homepage} target="_blank" rel="noopener noreferrer">
              <LinkIcon height={20} width={20} className={styles.icon} />
            </a>
          )}
        </div>
      </header>

      <p className={styles.description}>
        {repo.description || 'No description provided.'}
      </p>

      <div className={styles.stats}>
        <div className={styles.metric}>
          <WatchIcon className={styles.icon} /> {repo.watchers_count ?? repo.watchers}
        </div>
        <div className={styles.metric}>
          <ForkIcon className={styles.icon} /> {repo.forks_count ?? repo.forks}
        </div>
        <div className={styles.metric}>
          <StarIcon className={styles.icon} /> {repo.stargazers_count}
        </div>
      </div>
    </article>
  );
};

export default RepoCard;
