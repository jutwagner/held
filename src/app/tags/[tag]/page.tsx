import TagFeedClient from './TagFeedClient';

export default function TagFeedPage({ params }: { params: { tag: string } }) {
  const decodedTag = decodeURIComponent(params.tag || '');
  return <TagFeedClient tag={decodedTag} />;
}
