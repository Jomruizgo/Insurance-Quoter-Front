export interface Subscriber {
  id: string;
  name: string;
}

export interface Agent {
  code: string;
  name: string;
  subscriberId: string;
}
