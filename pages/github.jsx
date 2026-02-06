import Image from 'next/image';
import GitHubCalendar from 'react-github-calendar';
import RepoCard from '../components/RepoCard';
import styles from '../styles/GithubPage.module.css';

const GithubPage = ({ repos, user }) => {
  const theme = {
    level0: '#161B22',
    level1: '#0e4429',
    level2: '#006d32',
    level3: '#26a641',
    level4: '#39d353',
  };

  const username = user?.login || process.env.NEXT_PUBLIC_GITHUB_USERNAME;

  return (
    <section className={styles.page}>
      <a
        href={`https://github.com/${username}`}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.noColor}
      >
        <article className={styles.userCard}>
          <div className={styles.userIdentity}>
            <Image
              src={user?.avatar_url || '/me.jpeg'}
              className={styles.avatar}
              alt={username || 'GitHub profile image'}
              width={58}
              height={58}
            />
            <div>
              <h3 className={styles.username}>{username}</h3>
              <p className={styles.subtitle}>GitHub Profile</p>
            </div>
          </div>

          <div className={styles.stats}>
            <div>
              <span>{user?.public_repos ?? 0}</span>
              <p>Repos</p>
            </div>
            <div>
              <span>{user?.followers ?? 0}</span>
              <p>Followers</p>
            </div>
            <div>
              <span>{user?.following ?? 0}</span>
              <p>Following</p>
            </div>
          </div>
        </article>
      </a>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Popular Repositories</h3>
          <p>{repos.length} selected</p>
        </div>

        <div className={styles.container}>
          {repos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Contribution Heatmap</h3>
        </div>

        <div className={styles.contributions}>
          <GitHubCalendar
            username={process.env.NEXT_PUBLIC_GITHUB_USERNAME}
            theme={theme}
            hideColorLegend
          />
        </div>
      </section>
    </section>
  );
};

export async function getStaticProps() {
  let user;
  let repos;

  try {
    const userRes = await fetch(
      `https://api.github.com/users/${process.env.NEXT_PUBLIC_GITHUB_USERNAME}`,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_API_KEY}`,
        },
      }
    );

    if (!userRes.ok) {
      throw new Error(`Failed to fetch user data: ${userRes.status}`);
    }

    user = await userRes.json();

    const repoRes = await fetch(
      `https://api.github.com/users/${process.env.NEXT_PUBLIC_GITHUB_USERNAME}/repos?per_page=100`,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_API_KEY}`,
        },
      }
    );

    if (!repoRes.ok) {
      throw new Error(`Failed to fetch repos data: ${repoRes.status}`);
    }

    repos = await repoRes.json();

    if (!Array.isArray(repos)) {
      throw new Error('repos is not an array');
    }

    repos.sort((a, b) => {
      const repoAImportant =
        a.html_url.includes('EESTech') || a.html_url.includes('COSC');
      const repoBImportant =
        b.html_url.includes('EESTech') || b.html_url.includes('COSC');

      if (repoAImportant && !repoBImportant) return -1;
      if (repoBImportant && !repoAImportant) return 1;

      return (
        b.stargazers_count + b.watchers_count + b.forks_count -
        (a.stargazers_count + a.watchers_count + a.forks_count)
      );
    });

    repos = repos.slice(0, 8);
  } catch (error) {
    console.error('Error fetching GitHub data:', error);
    user = {};
    repos = [];
  }

  return {
    props: {
      title: 'GitHub',
      repos,
      user,
    },
    revalidate: 10,
  };
}

export default GithubPage;
