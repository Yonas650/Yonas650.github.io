import Image from 'next/image';
import styles from '../styles/ProjectCard.module.css';

const ProjectCard = ({ project }) => {
  const links = [
    { href: project.source_code, label: 'Code' },
    { href: project.demo, label: 'Demo' },
    { href: project.scholar, label: 'Paper' },
    { href: project.pypi, label: 'PyPI' },
  ].filter((item) => Boolean(item.href));

  return (
    <article className={styles.card}>
      <div className={styles.coverWrap}>
        <Image
          src={project.image}
          height={360}
          width={640}
          alt={project.name}
          className={styles.cover}
        />
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{project.name}</h3>
        <p className={styles.description}>{project.description}</p>

        <div className={styles.tags}>
          {project.tags.map((tag) => {
            const sanitized = tag
              .replace(/\s+/g, '-')
              .replace(/[^A-Za-z0-9_-]/g, '-')
              .replace(/-+/g, '-');
            const nospace = tag.replace(/[^A-Za-z0-9]/g, '');
            const classAliases = {
              'Node.js': 'NodeJS',
              'C++': 'Cpp',
              'Machine Learning': 'Machine-Learning',
              'Natural Language Processing': 'Natural-Language-Processing',
              'Data Analysis': 'Data-Analysis',
              'Exploratory Data Analysis': 'Exploratory-Data-Analysis',
              'AI Summarization': 'AI-Summarization',
            };

            return (
              <span
                key={`${project.id}-${tag}`}
                className={`${sanitized} ${nospace} ${classAliases[tag] || ''}`}
              >
                {tag}
              </span>
            );
          })}
        </div>

        <div className={styles.cta}>
          {links.map((item) => (
            <a
              key={`${project.id}-${item.label}`}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.linkBtn}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </article>
  );
};

export default ProjectCard;
