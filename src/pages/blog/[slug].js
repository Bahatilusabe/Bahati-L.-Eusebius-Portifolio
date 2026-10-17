import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Layout from '../../components/dashboard/Layout';
import { getBlogBySlug } from '../../lib/serverData';

export default function BlogArticlePage({ blog }) {
  const formattedDate = blog.createdAt
    ? new Date(blog.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : null;

  return (
    <Layout>
      <Head>
        <title>{blog.title} | Bahati L. Eusebius</title>
        <meta name="description" content={blog.summary || blog.title} />
      </Head>
      <main className="blog-article-shell">
        <Link href="/" className="blog-article-back">
          <ArrowLeft aria-hidden="true" />
          Back to portfolio
        </Link>
        <article className="glass-card blog-article-card">
          {blog.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="blog-article-cover" src={blog.coverImage} alt="" />
          ) : null}
          <header className="blog-article-header">
            <span className="portfolio-blog-category">{blog.category || 'General'}</span>
            {formattedDate ? <time dateTime={blog.createdAt}>{formattedDate}</time> : null}
            <h1>{blog.title}</h1>
            {blog.summary ? <p>{blog.summary}</p> : null}
          </header>
          {blog.tags.length ? (
            <div className="blog-article-tags" aria-label="Article tags">
              {blog.tags.map((tag) => <span key={tag} className="portfolio-chip">{tag}</span>)}
            </div>
          ) : null}
          <div className="blog-article-content">{blog.content}</div>
        </article>
      </main>
    </Layout>
  );
}

export async function getServerSideProps({ params }) {
  const blog = await getBlogBySlug(params?.slug);
  if (!blog) return { notFound: true };

  return { props: { blog } };
}
