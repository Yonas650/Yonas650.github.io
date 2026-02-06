import Image from 'next/image';
import GitHubCalendar from 'react-github-calendar';
import RepoCard from '../components/RepoCard';
import styles from '../styles/GithubPage.module.css';

const GithubPage = ({ repos, user }) => {
  console.log(repos);
  const theme = {
    level0: '#161B22',
    level1: '#0e4429',
    level2: '#006d32',
    level3: '#26a641',
    level4: '#39d353',
  };

  return (
    <>
      <a href="https://github.com/Yonas650" target="_blank" rel="noopener" className={styles.no_color}>
        <div className={styles.user}>
          <div>
            <Image
              src={user.avatar_url}
              className={styles.avatar}
              alt={user.login}
              width={50}
              height={50}
            />
            <h3 className={styles.username}>{user.login}</h3>
          </div>
          <div>
            <h3>{user.public_repos} repos</h3>
          </div>
          <div>
            <h3>{user.followers} followers</h3>
          </div>
        </div>
      </a>
      <div> <center><h3>My Most Popular Repositories on Github</h3></center></div>
      <div className={styles.container}>
        {repos.map((repo) => (
          <RepoCard key={repo.id} repo={repo} />
        ))}
      </div>
      <div><center><h3>My Github Calendar</h3></center></div>
      <br />
      <center>
        <div className={styles.contributions}>
          <GitHubCalendar
            username={process.env.NEXT_PUBLIC_GITHUB_USERNAME}
            theme={theme}
            hideColorLegend
          // hideMonthLabels
          />
        </div>
      </center>
    </>
  );
};

export async function getStaticProps() {
  let user, repos;

  try {
      // Fetch user data
      const userRes = await fetch(
          `https://api.github.com/users/${process.env.NEXT_PUBLIC_GITHUB_USERNAME}`, {
              headers: {
                  Authorization: `token ${process.env.GITHUB_API_KEY}`,
              },
          }
      );
      if (!userRes.ok) {
          throw new Error(`Failed to fetch user data: ${userRes.status}`);
      }
      user = await userRes.json();

      // Fetch repositories data
      const repoRes = await fetch(
          `https://api.github.com/users/${process.env.NEXT_PUBLIC_GITHUB_USERNAME}/repos?per_page=100`, {
              headers: {
                  Authorization: `token ${process.env.GITHUB_API_KEY}`,
              },
          }
      );
      if (!repoRes.ok) {
          throw new Error(`Failed to fetch repos data: ${repoRes.status}`);
      }
      repos = await repoRes.json();

      // Ensure repos is an array
      if (!Array.isArray(repos)) {
          throw new Error("repos is not an array");
      }

      // Sorting repositories
      repos.sort((a, b) => {
          const repoAImportant = a.html_url.includes('EESTech') || a.html_url.includes('COSC');
          const repoBImportant = b.html_url.includes('EESTech') || b.html_url.includes('COSC');

          if (repoAImportant && !repoBImportant) return -1;
          if (repoBImportant && !repoAImportant) return 1;

          return (b.stargazers_count + b.watchers_count + b.forks_count) - (a.stargazers_count + a.watchers_count + a.forks_count);
      });

      // Limiting to top 8 repos
      repos = repos.slice(0, 8);

  } catch (error) {
      console.error("Error fetching GitHub data:", error);
      // Handle errors or set defaults
      user = {}; // Default to an empty object if user data fetch fails
      repos = []; // Default to an empty array if repos data fetch fails or not an array
  }

  return {
      props: {
          title: 'GitHub',
          repos,
          user,
      },
      revalidate: 10, // Optionally, adjust this value as needed for your ISR needs
  };
}


export default GithubPage;
