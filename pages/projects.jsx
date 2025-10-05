import ProjectCard from '../components/ProjectCard';
import { getMLProjects } from './api/ml-projects';
import { getOpenAIAPIProjects } from './api/chatgpt_API_projects'; // Renamed to OpenAI
//import { getPyPiProjects } from './api/pypi-projects';
import { getMiscProjects } from './api/misc-projects';
import styles from '../styles/ProjectsPage.module.css';

const ProjectsPage = ({ ml_projects, openai_api_projects, pypi_projects, misc_projects }) => {
  return (
    <>
      <h3>Open Source Projects</h3>
      <br/>
      <center><h4>Machine Learning</h4></center>
      <hr/>
      <div className={styles.container}>
        {ml_projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
      <br/>
      <center><h4>OpenAI API Projects</h4></center>
      <hr/>
      <div className={styles.container}>
        {openai_api_projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
      {/*<br/>
      <center><h4>PyPi Packages</h4></center>
      <hr/>
      <div className={styles.container}>
        {pypi_projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>*/}

      <br/> 
      <center><h4>Misc Projects</h4></center>
      <hr/>
      <div className={styles.container}>
        {misc_projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </>
  );
};

export async function getStaticProps() {
  const ml_projects = getMLProjects();
  const openai_api_projects = getOpenAIAPIProjects();
  //const pypi_projects = getPyPiProjects();
  const misc_projects = getMiscProjects();

  return {
    props: { title: 'Projects', ml_projects, openai_api_projects, misc_projects },
  };
}

export default ProjectsPage;
