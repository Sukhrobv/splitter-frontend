// src/features/sessions/mock/history.ts

export type BillItem = {
  id: string;
  title: string;
  price: number;
  icon?: string;
};

export type BillParticipant = {
  id: string;
  name: string;
  avatarColor?: string;
  amount: number;
  items: BillItem[];
};

export type BillHistory = {
  id: string;
  title: string;
  date: string;
  participantsCount: number;
  totalAmount: number;
  participants: BillParticipant[];
};

const sushiSet: BillItem = { id: 'item-sushi', title: 'Sushi set', price: 70000, icon: '\u{1F363}' };
const cola: BillItem = { id: 'item-cola', title: 'Cola', price: 10000, icon: '\u{1F964}' };
const greenTea: BillItem = { id: 'item-tea', title: "Ko'k choy", price: 15000, icon: '\u{1F375}' };
const lavash: BillItem = { id: 'item-lavash', title: 'Lavash', price: 35000, icon: '\u{1F32F}' };
const tea: BillItem = { id: 'item-tea-generic', title: 'Choy', price: 10000, icon: '\u{1F375}' };
const cake: BillItem = { id: 'item-cake', title: 'Cake', price: 80000, icon: '\u{1F382}' };
const burger: BillItem = { id: 'item-burger', title: 'Burger', price: 35000, icon: '\u{1F354}' };
const juice: BillItem = { id: 'item-juice', title: 'Juice', price: 20000, icon: '\u{1F9C3}' };

export const BILL_HISTORY: BillHistory[] = [
  {
    id: 'sushi-night',
    title: 'Sushi kechasi',
    date: '25-avgust',
    participantsCount: 5,
    totalAmount: 540000,
    participants: [
      {
        id: 'men',
        name: 'Men',
        avatarColor: '#111111',
        amount: 95000,
        items: [sushiSet, cola, greenTea],
      },
      {
        id: 'joffrey',
        name: 'Joffrey Baratheon',
        avatarColor: '#F6C343',
        amount: 95000,
        items: [sushiSet, cola, greenTea],
      },
      {
        id: 'matilda',
        name: 'Matilda',
        avatarColor: '#F7B6B3',
        amount: 95000,
        items: [sushiSet, cola, greenTea],
      },
      {
        id: 'arya',
        name: 'Arya',
        avatarColor: '#2ECC71',
        amount: 95000,
        items: [sushiSet, cola, greenTea],
      },
      {
        id: 'sansa',
        name: 'Sansa',
        avatarColor: '#3498DB',
        amount: 95000,
        items: [sushiSet, cola, greenTea],
      },
    ],
  },
  {
    id: 'evos-lunch',
    title: 'Evos',
    date: '25-avgust',
    participantsCount: 3,
    totalAmount: 165000,
    participants: [
      {
        id: 'mike',
        name: 'Mike',
        avatarColor: '#E67E22',
        amount: 55000,
        items: [
          { ...lavash, id: 'item-lavash-1' },
          cola,
          { ...tea, id: 'item-tea-1' },
        ],
      },
      {
        id: 'anna',
        name: 'Anna',
        avatarColor: '#8E44AD',
        amount: 55000,
        items: [
          { ...lavash, id: 'item-lavash-2' },
          cola,
          { ...tea, id: 'item-tea-2' },
        ],
      },
      {
        id: 'john',
        name: 'John',
        avatarColor: '#1ABC9C',
        amount: 55000,
        items: [
          { ...lavash, id: 'item-lavash-3' },
          cola,
          { ...tea, id: 'item-tea-3' },
        ],
      },
    ],
  },
  {
    id: 'birthday',
    title: "Tug'ilgan kun",
    date: '25-avgust',
    participantsCount: 11,
    totalAmount: 605000,
    participants: [
      {
        id: 'host',
        name: 'Maruf',
        avatarColor: '#E74C3C',
        amount: 110000,
        items: [
          cake,
          cola,
          { ...tea, id: 'item-tea-4', title: 'Tea', price: 20000 },
        ],
      },
      {
        id: 'guest-1',
        name: 'Madina',
        avatarColor: '#9B59B6',
        amount: 55000,
        items: [
          { ...burger, id: 'item-burger-1' },
          { ...juice, id: 'item-juice-1' },
        ],
      },
      {
        id: 'guest-2',
        name: 'Javlon',
        avatarColor: '#2ECC71',
        amount: 55000,
        items: [
          { ...burger, id: 'item-burger-2' },
          { ...juice, id: 'item-juice-2' },
        ],
      },
    ],
  },
];

export const findBill = (id: string) => BILL_HISTORY.find((bill) => bill.id === id);
