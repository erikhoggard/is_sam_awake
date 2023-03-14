// pages/api/post/index.ts

import { getSession } from 'next-auth/react';
import prisma from '../../../lib/prisma';

// POST /api/post
// Required fields in body: title
// Optional fields in body: content
export default async function handle(req, res) {
	const { title, content } = req.body;

	const session = await getSession({ req });
	const potentialSam = await prisma.user.findFirst({
		where: {
			email: session.user.email
		}
	});

	const isSam = potentialSam.isSam;

	if (!session || isSam !== true) {
		res.status(403).send({ Error: "You aren't even Sam" });
		return;
	}

	const result = await prisma.post.create({
		data: {
			title: title,
			content: content,
			author: { connect: { email: session?.user?.email } },
		},
	});
	res.json(result);
}