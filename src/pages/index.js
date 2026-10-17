import Head from "next/head";
import { PortfolioPage } from "@/components/PortfolioPage";
import { getProjects, getBlogs, getVideos, getSkills, getSettings } from '@/lib/serverData';

export default function HomePage(props) {
  return (
    <>
      <Head>
  <title>{`${props.settings?.siteTitle || 'Bahati L. Eusebius'} | Cybersecurity Engineer`}</title>
        <meta
          name="description"
          content={props.settings?.description || 'Cybersecurity engineer and system developer building secure intelligent systems, AI defense concepts, and production-ready digital platforms.'}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <PortfolioPage {...props} />
    </>
  );
}

export async function getServerSideProps(context) {
  try {
    const [projects, blogs, videos, skills, settings] = await Promise.all([
      getProjects({ limit: 50 }),
      getBlogs({ limit: 10 }),
      getVideos({ limit: 20 }),
      getSkills({ limit: 100 }),
      getSettings(),
    ]);

    return { props: { projects, blogs, videos, skills, settings } };
  } catch (err) {
    // Log server-side and surface an empty state client-side with an error flag.
    console.error('SSR data fetch error:', err);
    return { props: { projects: [], blogs: [], videos: [], skills: [], settings: null, _ssrError: true } };
  }
}
