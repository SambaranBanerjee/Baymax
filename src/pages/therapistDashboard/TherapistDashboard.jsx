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
import Navbar from "@/components/Navbar";
import { SidebarNav } from "@/components/therapist-dashboard/SidebarNav";
import { DashboardLayout } from "./Layout";

export const TherapistDashboard = () => {
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
        const requestsList = requestsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
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
        const appointmentsList = appointmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUpcomingAppointments(appointmentsList);

        // Fetch patient count
        const patientsQuery = query(
          collection(db, "appointments"),
          where("therapistId", "==", user.uid)
        );
        const patientsSnapshot = await getDocs(patientsQuery);
        const uniquePatients = new Set(patientsSnapshot.docs.map(doc => doc.data().patientId));
        setPatientCount(uniquePatients.size);

        // Fetch recent messages
        const chatsQuery = query(collection(db, "chats"), limit(10));
        const chatsSnapshot = await getDocs(chatsQuery);
        let messagesList = [];

        for (const chatDoc of chatsSnapshot.docs) {
          const chatId = chatDoc.id;
          if (!chatId.includes(user.uid)) continue;

          const messagesQuery = query(
            collection(db, "chats", chatId, "messages"),
            orderBy("timestamp", "desc"),
            limit(5)
          );
          const messagesSnapshot = await getDocs(messagesQuery);
          
          messagesList = [
            ...messagesList,
            ...messagesSnapshot.docs
              .map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date()
              }))
              .filter(msg => msg.receiverId === user.uid)
          ];
        }

        setRecentMessages(messagesList
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 5));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        {/* Stats Cards */}
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
              <div className="text-3xl font-bold">{upcomingAppointments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Unread Messages</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <MessageSquare className="h-6 w-6 text-primary" />
              <div className="text-3xl font-bold">
                {recentMessages.filter(msg => !msg.read).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Patient Requests */}
          {pendingRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>New Patient Requests</CardTitle>
                <CardDescription>Patients waiting for approval</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{request.patientName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.patientName}</p>
                          <p className="text-sm text-muted-foreground">
                            {request.date && format(new Date(request.date), "MMM d")} at {request.time}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/patient-requests/${request.id}`}>View</Link>
                      </Button>
                    </div>
                  ))}
                  <Button className="w-full" variant="outline" asChild>
                    <Link to="/patient-requests">View All Requests</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>Scheduled sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{appointment.patientName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{appointment.patientName}</p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.date && format(new Date(appointment.date), "MMM d")} at {appointment.time}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/appointments/${appointment.id}`}>View</Link>
                      </Button>
                    </div>
                  ))}
                  <Button className="w-full" variant="outline" asChild>
                    <Link to="/appointments">View All Appointments</Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">No upcoming appointments</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Messages */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Messages</CardTitle>
              <CardDescription>Latest from patients</CardDescription>
            </CardHeader>
            <CardContent>
              {recentMessages.length > 0 ? (
                <div className="space-y-4">
                  {recentMessages.map((message) => (
                    <div key={message.id} className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{message.senderName?.charAt(0)}</AvatarFallback>
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
                    <Link to="/messages">View All Messages</Link>
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
    </DashboardLayout>
  );
};