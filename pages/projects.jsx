import ProjectCard from '../components/ProjectCard';
import { getMLProjects } from './api/ml-projects';
import { getOpenAIAPIProjects } from './api/chatgpt_API_projects';
import { getMiscProjects } from './api/misc-projects';
import styles from '../styles/ProjectsPage.module.css';

const ProjectsPage = ({ ml_projects, openai_api_projects, misc_projects }) => {
  const sections = [
    {
      id: 'machine-learning',
      title: 'Machine Learning',
      projects: ml_projects,
    },
    {
      id: 'openai-api',
      title: 'OpenAI API Projects',
      projects: openai_api_projects,
    },
    {
      id: 'misc-projects',
      title: 'Misc Projects',
      projects: misc_projects,
    },
  ];

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h2>Open Source Projects</h2>
        <p>
          A curated set of production-grade and research-driven builds across
          machine learning, software engineering, and applied AI.
        </p>
      </header>

      {sections.map((section) => (
        <section key={section.id} className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3>{section.title}</h3>
            <p>{section.projects.length} projects</p>
          </div>

          <div className={styles.container}>
            {section.projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      ))}
    </section>
  );
};

export async function getStaticProps() {
  const ml_projects = getMLProjects();
  const openai_api_projects = getOpenAIAPIProjects();
  const misc_projects = getMiscProjects();

  return {
    props: { title: 'Projects', ml_projects, openai_api_projects, misc_projects },
  };
}

export default ProjectsPage;
