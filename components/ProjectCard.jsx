import Image from 'next/image';
import styles from '../styles/ProjectCard.module.css';

const ProjectCard = ({ project }) => {
  return (
    <div className={styles.card}>
      <Image src={project.image} height={300} width={600} alt={project.name} />
      <div className={styles.content}>
        <h3>{project.name}</h3>
        <p>{project.description}</p>
        <div className={styles.tags}>
          {project.tags.map((tag) => {
            const sanitized = tag
              .replace(/\s+/g, '-')
              .replace(/[^A-Za-z0-9_-]/g, '-')
              .replace(/-+/g, '-');
            // Also include a no-space variant to match existing CSS like 'HuggingFace'
            const nospace = tag.replace(/[^A-Za-z0-9]/g, '');
            const classAliases = {
              'Node.js': 'NodeJS',
              'C++': 'Cpp',
              'Machine Learning': 'Machine-Learning',
              'Natural Language Processing': 'Natural-Language-Processing',
              'Data Analysis': 'Data-Analysis',
              'Exploratory Data Analysis': 'Exploratory-Data-Analysis',
            };
            return (
              <span key={tag} className={`${sanitized} ${nospace} ${classAliases[tag] || ''}`}>
                {tag}
              </span>
            );
          })}
        </div>
        <div className={styles.cta}>
          {project.source_code && (
            <a
              href={project.source_code}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.underline}
            >
              Code
            </a>
          )}
          {project.demo && (
          <a
            href={project.demo}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.underline}
          >
            Demo
          </a>
          )}
          {project.scholar && (
          <a
            href={project.scholar}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.underline}
          >
            Paper
          </a>
          )}
          {project.pypi && (
          <a
            href={project.pypi}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.underline}
          >
            PyPi
          </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
