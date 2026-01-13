import BoardCanvas from '@/components/BoardCanvas';

export default function BoardPage({ params }: { params: { id: string } }) {
  return <BoardCanvas boardId={params.id} />;
}
