import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, MessageSquare, Users, Bell } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
const TherapistDashboard = () => {
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [patientCount, setPatientCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        // Fetch pending appointment requests
        const requestsQuery = query(
          collection(db, "appointments"),
          where("therapistId", "==", user.uid),
          where("status", "==", "pending"),
          orderBy("createdAt", "desc"),
          limit(3)
        );

        const requestsSnapshot = await getDocs(requestsQuery);
        const requestsList = [];

        requestsSnapshot.forEach((doc) => {
          const data = doc.data();
          requestsList.push({
            id: doc.id,
            patientName: data.patientName,
            date: data.date,
            time: data.time,
            createdAt: data.createdAt,
          });
        });

        setPendingRequests(requestsList);

        // Fetch upcoming appointments
        const today = new Date().toISOString().split("T")[0];
        const appointmentsQuery = query(
          collection(db, "appointments"),
          where("therapistId", "==", user.uid),
          where("date", ">=", today),
          where("status", "in", ["scheduled", "accepted"]),
          orderBy("date"),
          orderBy("time"),
          limit(5)
        );

        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        const appointmentsList = [];

        appointmentsSnapshot.forEach((doc) => {
          const data = doc.data();
          appointmentsList.push({
            id: doc.id,
            patientName: data.patientName,
            date: data.date,
            time: data.time,
          });
        });

        setUpcomingAppointments(appointmentsList);

        // Fetch patient count (unique patients who have appointments)
        const patientsQuery = query(
          collection(db, "appointments"),
          where("therapistId", "==", user.uid)
        );

        const patientsSnapshot = await getDocs(patientsQuery);
        const uniquePatients = new Set();

        patientsSnapshot.forEach((doc) => {
          const data = doc.data();
          uniquePatients.add(data.patientId);
        });

        setPatientCount(uniquePatients.size);

        // Fetch recent messages from all chats
        const chatsQuery = query(collection(db, "chats"), limit(10));

        const chatsSnapshot = await getDocs(chatsQuery);
        const messagesList = [];

        for (const chatDoc of chatsSnapshot.docs) {
          const chatId = chatDoc.id;

          // Only process chats that involve the current therapist
          if (!chatId.includes(user.uid)) continue;

          const messagesQuery = query(
            collection(db, "chats", chatId, "messages"),
            orderBy("timestamp", "desc"),
            limit(5)
          );

          const messagesSnapshot = await getDocs(messagesQuery);

          messagesSnapshot.forEach((doc) => {
            const data = doc.data();

            // Only include messages sent to the therapist
            if (data.receiverId === user.uid) {
              messagesList.push({
                id: doc.id,
                senderName: data.senderName,
                text: data.text,
                timestamp: data.timestamp?.toDate() || new Date(),
                read: data.read || false,
              });
            }
          });
        }

        // Sort by timestamp and limit to 5
        messagesList.sort((a, b) => b.timestamp - a.timestamp);
        setRecentMessages(messagesList.slice(0, 5));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // if (loading) {
  //   return (
  //     <div className="space-y-6">
  //       <h1 className="text-3xl font-bold">Dashboard</h1>
  //       <div className="flex justify-center py-12">
  //         <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Patient Requests</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Bell className="h-6 w-6 text-primary" />
            <div className="text-3xl font-bold">{pendingRequests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Patients</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Users className="h-6 w-6 text-primary" />
            <div className="text-3xl font-bold">{patientCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Upcoming Sessions</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Calendar className="h-6 w-6 text-primary" />
            <div className="text-3xl font-bold">
              {upcomingAppointments.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Unread Messages</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <MessageSquare className="h-6 w-6 text-primary" />
            <div className="text-3xl font-bold">
              {recentMessages.filter((msg) => !msg.read).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {pendingRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>New Patient Requests</CardTitle>
              <CardDescription>
                Patients waiting for your approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {request.patientName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{request.patientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(request.date), "MMM d")} at{" "}
                          {request.time}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/therapist-dashboard/patient-requests">
                        View
                      </Link>
                    </Button>
                  </div>
                ))}
                <Button className="w-full" variant="outline" asChild>
                  <Link to="/therapist-dashboard/patient-requests">
                    View All Requests
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>
              Your scheduled sessions for the next few days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {appointment.patientName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{appointment.patientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(appointment.date), "MMM d")} at{" "}
                          {appointment.time}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        to={`/therapist-dashboard/appointments/${appointment.id}`}
                      >
                        View
                      </Link>
                    </Button>
                  </div>
                ))}
                <Button className="w-full" variant="outline" asChild>
                  <Link to="/therapist-dashboard/appointments">
                    View All Appointments
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">
                  No upcoming appointments
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Messages</CardTitle>
            <CardDescription>
              Latest messages from your patients
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentMessages.length > 0 ? (
              <div className="space-y-4">
                {recentMessages.map((message) => (
                  <div key={message.id} className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {message.senderName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium flex items-center gap-2">
                          {message.senderName}
                          {!message.read && (
                            <span className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(message.timestamp, "MMM d, h:mm a")}
                        </p>
                      </div>
                      <p className="text-sm truncate">{message.text}</p>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/therapist-dashboard/messages">
                    View All Messages
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No recent messages</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TherapistDashboard;
