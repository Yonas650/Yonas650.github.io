import Image from 'next/image';
import styles from '../styles/Titlebar.module.css';

const menuItems = ['File', 'Edit', 'View', 'Go', 'Run', 'Terminal', 'Help'];

const Titlebar = () => {
  return (
    <header className={styles.titlebar}>
      <div className={styles.left}>
        <Image
          src="/vscode_icon.svg"
          alt="VSCode Icon"
          height={15}
          width={15}
          className={styles.icon}
        />
        <nav className={styles.items} aria-label="Main menu">
          {menuItems.map((item) => (
            <button key={item} type="button" className={styles.menuItem}>
              {item}
            </button>
          ))}
        </nav>
      </div>
      <p className={styles.title}>Yonas Atinafu - Portfolio</p>
      <div className={styles.windowButtons} aria-hidden="true">
        <span className={styles.minimize}></span>
        <span className={styles.maximize}></span>
        <span className={styles.close}></span>
      </div>
    </header>
  );
};

export default Titlebar;
