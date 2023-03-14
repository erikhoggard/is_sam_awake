// pages/api/post/index.ts

import { getSession } from 'next-auth/react';
import prisma from '../../../lib/prisma';

export default async function handle(req, res) {
	const { title, content } = req.body;

	const result = await prisma.logEntry.findMany({
		orderBy: {
			createdAt: 'desc'
		},
		take: 1
	});
	res.json(result);
}