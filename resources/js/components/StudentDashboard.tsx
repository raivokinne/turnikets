import { Button } from '@/components/ui/button';
import {
  User as UserIcon,
  QrCode,
  Clock,
  Mail,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const StudentDashboard = () => {
  const recentEntries = [
    { id: 1, student: "Anna Bērziņa", time: "08:25", status: "klātesošie", class: "12B" },
    { id: 2, student: "Jānis Kalniņš", time: "08:27", status: "klātesošie", class: "10A" },
    { id: 3, student: "Līga Ozoliņa", time: "08:32", status: "klātesošie", class: "11C" },
    { id: 4, student: "Kārlis Jansons", time: "08:45", status: "klātesošie", class: "9B" },
    { id: 5, student: "Marta Zariņa", time: "09:05", status: "prombūtne", class: "10A" }
  ];

  const entryStatistics = {
    total: 850,
    present: 775,
    absent: 75
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Kopējais skolēnu skaits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entryStatistics.total}</div>
            <div className="text-xs text-gray-500 mt-1">Reģistrēti sistēmā</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Klātesošie šodien</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{entryStatistics.present}</div>
            <Progress value={(entryStatistics.present/entryStatistics.total)*100} className="h-2 mt-2" />
            <div className="text-xs text-gray-500 mt-1">{Math.round((entryStatistics.present/entryStatistics.total)*100)}% apmeklējums</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Prombūtnē</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{entryStatistics.absent}</div>
            <Progress value={(entryStatistics.absent/entryStatistics.total)*100} className="h-2 mt-2 bg-red-100" />
            <div className="text-xs text-gray-500 mt-1">{Math.round((entryStatistics.absent/entryStatistics.total)*100)}% kavējumu līmenis</div>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Jaunākie ieraksti</CardTitle>
              <Button variant="link" size="sm" className="text-blue-600">
                Skatīt visus
              </Button>
            </div>
            <CardDescription>Pēdējie skolēnu ieejas reģistrācijas ieraksti</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEntries.map(entry => (
                <div key={entry.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {entry.student.split(' ').map(name => name[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{entry.student}</p>
                      <p className="text-xs text-gray-500">Klase {entry.class}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge
                      variant={entry.status === 'prombūtne' ? 'outline' : 'secondary'}
                      className={entry.status === 'prombūtne' ? 'border-red-500 text-red-600' : ''}
                    >
                      {entry.status === 'klātesošie' ? 'Klātesošs' : 'Prombūtnē'}
                    </Badge>
                    <span className="text-sm text-gray-600">{entry.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-3">
            <p className="text-xs text-gray-500">Atjaunināts 09:15</p>
          </CardFooter>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle>Ātrās darbības</CardTitle>
            <CardDescription>Pārvaldīt skolēnu piekļuvi</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" variant="default">
              <UserIcon className="mr-2 h-4 w-4" />
              Pievienot jaunu skolēnu
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <QrCode className="mr-2 h-4 w-4" />
              Ģenerēt QR kodus
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Mail className="mr-2 h-4 w-4" />
              Nosūtīt QR kodus pa e-pastu
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Clock className="mr-2 h-4 w-4" />
              Apskatīt šodienas kavējumus
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Ģenerēt apmeklējuma atskaiti
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <AlertCircle className="mr-2 h-4 w-4" />
              Paziņot par kavējumiem
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default StudentDashboard;
