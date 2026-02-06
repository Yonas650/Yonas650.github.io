import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import styles from '../styles/Tab.module.css';

const Tab = ({ icon, filename, path }) => {
  const router = useRouter();
  const isActive = router.pathname === path;

  return (
    <Link href={path}>
      <a
        className={`${styles.tab} ${isActive ? styles.active : ''}`}
        role="tab"
        aria-selected={isActive}
        aria-current={isActive ? 'page' : undefined}
      >
        <Image src={icon} alt={filename} height={18} width={18} />
        <p>{filename}</p>
      </a>
    </Link>
  );
};

export default Tab;
