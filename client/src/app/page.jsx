import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Welcome to MyApp</h1>
      <p className={styles.subtitle}>This is a simple Next.js project with vanilla CSS</p>
    </main>
  );
}
