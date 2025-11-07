import type { NextApiRequest, NextApiResponse } from 'next';
import { addSelection, getDashboardSnapshot, listSelections, type CreateSelectionInput, type MealSlot } from '../../lib/dataStore';

type IncomingEntry = Partial<CreateSelectionInput> & { meals?: Partial<MealSlot> };

const allowCors = (res: NextApiResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  allowCors(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json({
      selections: listSelections(),
      dashboard: getDashboardSnapshot()
    });
    return;
  }

  if (req.method === 'POST') {
    try {
      const payload = req.body ?? {};
      const entries: IncomingEntry[] = Array.isArray(payload.entries)
        ? payload.entries
        : [
            {
              employee: payload.employee,
              department: payload.department,
              shift: payload.shift,
              date: payload.date,
              meals: payload.meals,
              remarks: payload.remarks
            }
          ];

      const sanitizedEntries = entries.filter((entry): entry is IncomingEntry => Boolean(entry));

      const selections = sanitizedEntries.map(entry => {
        const { employee, department, shift, date, meals, remarks } = entry ?? {};
        if (!employee || !department || !shift || !date || !meals) {
          throw new Error('Missing required fields');
        }

        const normalizedMeals: MealSlot = {
          breakfast: Boolean(meals.breakfast),
          lunch: Boolean(meals.lunch),
          dinner: Boolean(meals.dinner)
        };

        const normalizedShift = String(shift).trim() as CreateSelectionInput['shift'];
        if (!['morning', 'general', 'evening'].includes(normalizedShift)) {
          throw new Error('Missing required fields');
        }

        return addSelection({
          employee: String(employee).trim(),
          department: String(department).trim(),
          shift: normalizedShift,
          date: String(date),
          meals: normalizedMeals,
          remarks: remarks ? String(remarks).slice(0, 180) : undefined
        });
      });

      res.status(201).json({
        selections,
        dashboard: getDashboardSnapshot()
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to add selection', error);
      const message = error instanceof Error ? error.message : 'Failed to add selection';
      if (message === 'Missing required fields') {
        res.status(400).json({ error: message });
        return;
      }
      res.status(500).json({ error: 'Failed to add selection' });
    }
    return;
  }

  res.setHeader('Allow', 'GET,POST,OPTIONS');
  res.status(405).json({ error: 'Method Not Allowed' });
}
