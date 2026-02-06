import Titlebar from '../components/Titlebar';
import Sidebar from '../components/Sidebar';
import Explorer from '../components/Explorer';
import Bottombar from '../components/Bottombar';
import Tabsbar from './Tabsbar';
import styles from '../styles/Layout.module.css';

const Layout = ({ children }) => {
  return (
    <>
      <Titlebar />
      <div className={styles.main}>
        <Sidebar />
        <Explorer />
        <section className={styles.workspace}>
          <Tabsbar />
          <main className={styles.content}>{children}</main>
        </section>
      </div>
      <Bottombar />
    </>
  );
};

export default Layout;
