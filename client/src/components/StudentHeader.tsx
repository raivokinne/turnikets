import React from 'react';
import { Search, X, Filter } from 'lucide-react';

interface SimpleHeaderProps {
    title: string;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedClass: string;
    selectedStatus: string;
    setSelectedClass: (className: string) => void;
    setSelectedStatus: (status: string) => void;
    classes: string[];
    statuses: string[];
}

const StudentHeader: React.FC<SimpleHeaderProps> = ({
    title,
    searchQuery,
    setSearchQuery,
    selectedClass,
    setSelectedClass,
    setSelectedStatus,
    selectedStatus,
    classes,
    statuses
}) => {
    return (
        <div className="bg-white rounded-lg shadow-sm p-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                {title}
            </h1>

            <div className="space-y-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Ierakstiet skolēna vārdu..."
                        className="w-full h-12 px-4 pl-12 text-lg border border-gray-300 rounded-lg"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />

                    {searchQuery && (
                        <button
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 h-6 w-6 flex items-center justify-center bg-gray-200 rounded-full"
                            onClick={() => setSearchQuery('')}
                            aria-label="Notīrīt meklēšanu"
                        >
                            <X className="h-4 w-4 text-gray-600" />
                        </button>
                    )}
                </div>

                <div className='flex items-center space-x-4'>
                    <div className="flex items-center space-x-4">
                        <Filter className="h-6 w-6 text-gray-500" />
                        <select
                            className="h-12 px-4 text-lg border border-gray-300 rounded-lg bg-white"
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                        >
                            <option value="">Visas klases</option>
                            {classes.map((className) => (
                                <option key={className} value={className}>{className}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center space-x-4">
                        <Filter className="h-6 w-6 text-gray-500" />
                        <select
                            className="h-12 px-4 text-lg border border-gray-300 rounded-lg bg-white"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                            <option value="">Viss</option>
                            <option value="prombutnē">Prombutnē</option>
                            <option value="klātbutne">Klātbutne</option>
                        </select>
                    </div>
                </div>
            </div>

            {(searchQuery || selectedClass || selectedStatus) && (
                <div className="mt-4 space-x-2">
                    {searchQuery && (
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            Meklē: "{searchQuery}"
                        </span>
                    )}
                    {selectedClass && (
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            Klase: {selectedClass}
                        </span>
                    )}
                    {selectedStatus && (
                        <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                            Status: {selectedStatus}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default StudentHeader;
