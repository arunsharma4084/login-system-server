const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const { 
    userOneId, 
    userOne, 
    setUpTestDatabase 
    } = require('./fixtures/db')

beforeEach(setUpTestDatabase)

// afterEach(() => {
//     console.log('after each')
// })

test('should sign up a new user', async () => {
    const response = await request(app).post('/users').send({
        name: 'Arun',
        email: 'arunsharma@example.com',
        password: 'mypass&123'
    }).expect(201) 

    // Assert that the database was changed successfully
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()

    // Assertion about the response
    expect(response.body).toMatchObject({
        user: {
            name: 'Arun',
            email: 'arunsharma@example.com'
        }, 
        token: user.tokens[0].token
    })

    expect(user.password).not.toBe('mypass&123')
})  

test('should log in existing user', async () => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200)

    const user = await User.findById(response.body.user._id)
    expect(response.body.token).toBe(user.tokens[1].token)
})

test('should not log in non existent user', async () => {
    await request(app).post('/users/login').send({
        email: userOne.email + "dhg",
        password: userOne.password
    }).expect(400)
})

test('should get profile for user', async () => {
    await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
})

test('should not get profile of unauthenticated user', async () => {
    await request(app).get('/users/me').send().expect(401)
})

test('should delete account for user', async () => {
    const response = await request(app)
        .delete('/users/me')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    const user = await User.findById(userOneId)
    expect(user).toBeNull()
})

test('should not delete account for unauthorised user', async () => {
    await request(app)
        .delete('/users/me')
        .send()
        .expect(401)
})

test('should upload avatar image', async() => {
    await request(app)
        .post('/users/me/avatar')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .attach('avatar', 'tests/fixtures/Chintu_Photo.jpg')
        .expect(200)
    
    const user = await User.findById(userOneId)
    expect(user.avatar).toEqual(expect.any(Buffer))
})

test('should update valid user fields', async () => {
    const response = await request(app)
            .patch('/users/me')
            .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
            .send({
                name: 'Govind'
            })
            .expect(200)
    
    const user = await User.findById(userOneId)
    expect(user.name).toBe('Govind')
})

test('should not update invalid user fields', async () => {
    const response = await request(app)
            .patch('/users/me')
            .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
            .send({
                location: 'Jaipur'
            })
            .expect(400)
})