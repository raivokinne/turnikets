import React, { useState } from 'react';
import StudentHeader from './StudentHeader';
import StudentList from './StudentList';
import QuickActions from './QuickActions';
import { getAttendanceData } from '@/data/attendanceData';

const SimpleStudentDashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const attendanceData = getAttendanceData();

  const classes = Array.from(new Set(attendanceData.map(student => student.class))).sort();

  const filteredStudents = attendanceData.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = !selectedClass || student.class === selectedClass;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="p-4 md:p-6">
      <StudentHeader
        title="Skolēnu apmeklējums"
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        classes={classes}
      />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <StudentList students={filteredStudents} />
        </div>

        <div className="lg:col-span-1">
          <QuickActions />
        </div>
      </div>
    </div>
  );
};

export default SimpleStudentDashboard;
