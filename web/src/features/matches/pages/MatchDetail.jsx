import { useParams } from 'react-router-dom';
export default function MatchDetail() {
  const { id } = useParams();
  return <div className="p-6 pt-14"><h1 className="text-xl font-bold">Match #{id}</h1><p className="text-gray-500 mt-2">Match analysis & predictions coming soon...</p></div>;
}
