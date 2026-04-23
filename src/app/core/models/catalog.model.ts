export interface Subscriber {
  id: string;
  name: string;
}

export interface Agent {
  code: string;
  name: string;
  subscriberId: string;
}

export interface BusinessLine {
  code: string;
  description: string;
  fireKey: string;
}
