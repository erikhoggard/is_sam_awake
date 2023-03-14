// pages/api/post/index.ts

import { getSession } from 'next-auth/react';
import prisma from '../../../lib/prisma';

export default async function handle(req, res) {
	const { title, content } = req.body;

	const result = await prisma.post.findMany({
		where: { published: false },
		include: {
			author: {
				select: { name: true },
			},
		},
		orderBy: {
			createdAt: 'desc'
		} as any,
		take: 1
	});

	res.json(result);
}