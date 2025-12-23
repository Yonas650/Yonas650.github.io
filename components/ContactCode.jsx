import styles from '../styles/ContactCode.module.css';

const contactItems = [
  {
    social: 'Email',
    link: 'yatinafu@uwaterloo.ca',
    href: 'mailto:yatinafu@uwaterloo.ca',
  },
  {
    social: 'Phone',
    link: 'null',
    //href: 'null',
  },
  {
    social: 'GitHub',
    link: 'github.com/Yonas650',
    href: 'https://github.com/Yonas650',
  },
  {
    social: 'LinkedIn',
    link: 'linkedin.com/in/yonas-atinafu-b35921372',
    href: 'https://www.linkedin.com/in/yonas-atinafu-b35921372/',
  },
  {
    social: 'Portfolio Website',
    link: 'Website',
    href: 'https://yonasatinafu.com/',
  }
];

const ContactCode = () => {
  return (
    <div className={styles.code}>
      <p className={styles.line}>
        tag: <a>production</a>
      </p>
      <p className={styles.line}>
        <span>Yonas</span>&#58;
      </p>
      <p className={styles.line}>
        &nbsp;&nbsp;&nbsp;&#8212; <span>contact</span>&#58;
      </p>
      {contactItems.map((item, index) => (
        <p className={styles.line} key={index}>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{item.social}:{' '}
          <a href={item.href} target="_blank" rel="noopener noreferrer">
            {item.link}
          </a>
        </p>
      ))}
    </div>
  );
};

export default ContactCode;
