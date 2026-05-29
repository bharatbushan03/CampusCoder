export interface CodingEvent {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  date: string;
  time: string;
  location: string; // e.g. "Google Meet", "Seminar Hall A", "Discord"
  type: 'workshop' | 'coding_session' | 'placement_prep' | 'hackathon' | 'other';
  speaker: {
    name: string;
    role: string;
    avatar?: string;
  };
  seatsTotal: number;
  seatsRegistered: number;
  tags: string[];
}

export interface Registration {
  id: string;
  eventId: string;
  studentName: string;
  studentEmail: string;
  graduationYear: string;
  codingInterests: string[];
  registeredAt: string;
}
