import React from 'react';
import Link from 'next/link';

export interface DisasterCardProps {
  id: string;
  title: string;
  location: string;
  tags: string[];
  createdAt: string;
  isOwner?: boolean;
}

const DisasterCard: React.FC<DisasterCardProps> = ({ id, title, location, tags, createdAt, isOwner }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-4 mb-4 flex flex-col h-full">
      <h2 className="text-lg font-bold text-blue-800" title={title} tabIndex={0} aria-label={`Disaster title: ${title}`}>{title}</h2>
      <div className="text-sm text-gray-700 mb-2" title={location} tabIndex={0} aria-label={`Location: ${location}`}>{location}</div>
      <div className="flex-1" />
      <div className="flex flex-wrap gap-2 mb-2" aria-label="Tags">
        {tags.map(tag => (
          <span key={tag} className="inline-block bg-blue-100 text-blue-700 rounded-full px-2 py-1 text-sm" tabIndex={0} aria-label={`Tag: ${tag}`}>{tag}</span>
        ))}
      </div>
      <div className="flex items-end justify-between mt-auto">
        <div className="flex gap-2 items-end">
          <Link href={`/disaster/${id}`} passHref legacyBehavior>
            <a className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 font-semibold">View</a>
          </Link>
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap ml-2 pb-1">{new Date(createdAt).toLocaleString()}</span>
      </div>
    </div>
  );
};

export default DisasterCard;
