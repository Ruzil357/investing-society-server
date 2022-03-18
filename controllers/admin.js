<<<<<<< HEAD
import express from 'express'
const router = express.Router()

import Invites from '../models/invite.model.js'
import { utcTimeNow } from '../utils/time.js'
import { sendBulk } from '../utils/emailClient.js'
=======
const router = require('express').Router()
const Invites = require('../models/invite.model')
const { utcTimeNow } = require('../utils/time')
const { sendBulk, sendEmail } = require('../utils/emailClient')
>>>>>>> b96863c989e84b843bb1ac0a4a6ef3a35b660e7d

router.post('/sendMailToAll', async (req, res) => {
  const { subject, emailHeader, content } = req.body

  if (!subject || !emailHeader || !content) {
    return res.sendStatus(400)
  }

  const invites = await Invites.find({}).select('email name').exec()

  try {
    const status = await sendBulk(
      invites.map((invite) => ({
        to: invite.email,
        name: invite.name.split(' ')[0],
        subject,
        header: emailHeader,
        content,
      }))
    )
    res.status(200).send(status)
  } catch (e) {
    res.status(500).send(e)
  }
})

router.post('/sendMail', async (req, res) => {
  const { to, name, subject, emailHeader, content } = req.body

  if (!subject || !emailHeader || !content || !to || !name) {
    return res.sendStatus(400)
  }

  await sendEmail({
    to,
    name,
    subject,
    header: emailHeader,
    content,
  })

  res.sendStatus(200)
})

router.post('/sanitize', async (req, res) => {
  const timeNow = utcTimeNow().getTime()
  const expiryTime = timeNow - 172800000

  // Delete all invites that have expired and don't have an ID yet
  try {
    const deleted = await Invites.deleteMany({
      $or: [
        {
          createdAt: { $lte: expiryTime },
        },
        { createdAt: { $exists: false } },
      ],
      discordId: { $exists: false },
    })
    res.status(201).send(deleted)
  } catch (error) {
    res.status(500).send({ error })
  }
})

export default router
