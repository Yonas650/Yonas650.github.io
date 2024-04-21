import styles from '../styles/ContactCode.module.css';

const contactItems = [
  {
    social: 'Email',
    link: 'yonasmuluatinafu@gmail.com',
    href: 'mailto:yonasmuluatinafu@gmail.com',
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
    social: 'Portfolio Website',
    link: 'portfolio_website_address', // Replace this with your actual portfolio website address if you have one
    href: 'https://your_portfolio_website_address', // Replace this URL as well
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
