const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const cors = require("cors")
const User = require('../models/user')
const auth = require("../middleware/auth")
const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account')

const router = express.Router()

router.post('/users', cors(), async (req, res) => {
    const user = new User(req.body)

    try{ 
        await user.save()
        sendWelcomeEmail(user.email, user.username)
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
    } catch (error) {
        res.status(400).send(error)
    }
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({user, token})
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })

        await req.user.save()
        res.send()
    } catch(e) {
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch(e) {
        res.status(500).send()
    }
})

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

router.patch('/users/me', auth, async (req, res) => {
    const allowedUpdates = ['username', 'email', 'password']
    const updates = Object.keys(req.body)
    const isValidOperation = updates.every((item) => allowedUpdates.includes(item))

    if(!isValidOperation){
        return res.status(400).send({error: "Invalid Updates"})
    }

    try{
        updates.forEach((update) => {
            req.user[update] = req.body[update]
        })
        await req.user.save()
    
        res.send(req.user)
    } catch(error){
        res.status(400).send(error)
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try{
        await req.user.deleteOne()
        sendCancellationEmail(req.user.email, req.user.username)
        res.send(req.user)
    } catch(error) {
        res.status(500).send(error)
    }
})

const upload = multer({
    // dest: 'avatars',
    limits: {
        fileSize: 1024000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error('Please upload an image'))
        }
        cb(null, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize(250, 250).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

router.get('/users/:id/avatar', async(req, res) => {
    try{
        const user = await User.findById(req.params.id)

        if(!user || !user.avatar){
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch(e){
        res.status(404).send()
    }
})

module.exports = router