import React from 'react';

export default function SettingsIndex() {
  // This page immediately redirects on the server; the component is a fallback.
  return <div />;
}

export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/secure-console/settings/cv',
      permanent: false,
    },
  };
}
