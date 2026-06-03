import { notFound } from 'next/navigation'
import FeelingStory from '../../../components/FeelingStory'
import { stories, type StorySlug } from '../../../components/storyData'

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  if (!(slug in stories)) {
    notFound()
  }

  return <FeelingStory slug={slug as StorySlug} />
}
