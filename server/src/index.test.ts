/// <reference types="vitest/globals" />
import request from 'supertest';
import app from './index';

describe('GET /', () => {
  it('should return DolceForte API message', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('DolceForte API');
  });
});

describe('GraphQL createUser Mutation', () => {
  const createUserMutation = `
    mutation CreateUser($input: CreateUserInput!) {
      createUser(input: $input) {
        id
        name
        fullName
        entityType
        email
        phone
        bio
        tgId
        pib
        mbr
        account
        bank
      }
    }
  `;

  it('should create a user successfully', async () => {
    const timestamp = Date.now();
    const variables = {
      input: {
        name: `testuser${timestamp}`,
        fullName: 'Test User',
        email: `test${timestamp}@example.com`,
        phone: '+1234567890',
        bio: 'Test bio',
        tgId: '123456789',
        password: 'securepassword123',
      },
    };

    const response = await request(app)
      .post('/graphql')
      .send({ query: createUserMutation, variables })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.createUser).toMatchObject({
      name: `testuser${timestamp}`,
      fullName: 'Test User',
      email: `test${timestamp}@example.com`,
      phone: '+1234567890',
      bio: 'Test bio',
      tgId: '123456789',
    });
    expect(response.body.data.createUser.id).toBeDefined();
  });

  it('should fail when required fields are missing', async () => {
    const timestamp = Date.now();
    const variables = {
      input: {
        name: `testuser${timestamp}`,
        // missing fullName, email, password
        phone: '+1234567890',
      },
    };

    const response = await request(app)
      .post('/graphql')
      .send({ query: createUserMutation, variables })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  it('should fail when email already exists', async () => {
    const timestamp = Date.now();
    const email = `duplicate${timestamp}@example.com`;

    // First create a user
    const variables1 = {
      input: {
        name: `user1${timestamp}`,
        fullName: 'User One',
        email: email,
        password: 'password123',
      },
    };

    await request(app)
      .post('/graphql')
      .send({ query: createUserMutation, variables: variables1 })
      .set('Content-Type', 'application/json');

    // Try to create another user with same email
    const variables2 = {
      input: {
        name: `user2${timestamp}`,
        fullName: 'User Two',
        email: email,
        password: 'password456',
      },
    };

    const response = await request(app)
      .post('/graphql')
      .send({ query: createUserMutation, variables: variables2 })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toContain('Unique constraint');
  });

  it('should handle optional fields correctly', async () => {
    const timestamp = Date.now();
    const variables = {
      input: {
        name: `minimaluser${timestamp}`,
        fullName: 'Minimal User',
        email: `minimal${timestamp}@example.com`,
        password: 'password123',
        // phone, bio, tgId are optional
      },
    };

    const response = await request(app)
      .post('/graphql')
      .send({ query: createUserMutation, variables })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.createUser).toMatchObject({
      name: `minimaluser${timestamp}`,
      fullName: 'Minimal User',
      entityType: 'INDIVIDUAL',
      email: `minimal${timestamp}@example.com`,
      phone: null,
      bio: null,
      tgId: null,
    });
  });

  it('should fail when legal entity fields are missing', async () => {
    const timestamp = Date.now();
    const variables = {
      input: {
        name: `legalmissing${timestamp}`,
        fullName: 'Legal Missing',
        entityType: 'LEGAL_ENTITY',
        email: `legalmissing${timestamp}@example.com`,
        password: 'password123',
      },
    };

    const response = await request(app)
      .post('/graphql')
      .send({ query: createUserMutation, variables })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toContain(
      'Missing required legal entity fields'
    );
  });

  it('should create legal entity when all required fields are provided', async () => {
    const timestamp = Date.now();
    const variables = {
      input: {
        name: `legalok${timestamp}`,
        fullName: 'Legal Ready',
        entityType: 'LEGAL_ENTITY',
        email: `legalok${timestamp}@example.com`,
        password: 'password123',
        pib: `10${timestamp}`,
        mbr: `20${timestamp}`,
        account: `160-12345${timestamp % 1000}-12`,
        bank: 'Banca Intesa',
      },
    };

    const response = await request(app)
      .post('/graphql')
      .send({ query: createUserMutation, variables })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.createUser).toMatchObject({
      name: `legalok${timestamp}`,
      fullName: 'Legal Ready',
      entityType: 'LEGAL_ENTITY',
      email: `legalok${timestamp}@example.com`,
      pib: `10${timestamp}`,
      mbr: `20${timestamp}`,
      account: `160-12345${timestamp % 1000}-12`,
      bank: 'Banca Intesa',
    });
  });
});

describe('GraphQL updateSessionUser Mutation', () => {
  const createUserMutation = `
    mutation CreateUser($input: CreateUserInput!) {
      createUser(input: $input) {
        id
      }
    }
  `;

  const updateSessionUserMutation = `
    mutation UpdateSessionUser($input: UpdateSessionUserInput!) {
      updateSessionUser(input: $input) {
        id
        name
        fullName
        entityType
        email
        phone
        pib
        mbr
        account
        bank
      }
    }
  `;

  it('should update the authenticated user profile', async () => {
    const agent = request.agent(app);
    const timestamp = Date.now();

    await agent
      .post('/graphql')
      .send({
        query: createUserMutation,
        variables: {
          input: {
            name: `profile${timestamp}`,
            fullName: 'Profile User',
            email: `profile${timestamp}@example.com`,
            password: 'password123',
          },
        },
      })
      .set('Content-Type', 'application/json');

    const response = await agent
      .post('/graphql')
      .send({
        query: updateSessionUserMutation,
        variables: {
          input: {
            name: `updated${timestamp}`,
            fullName: 'Updated User',
            entityType: 'LEGAL_ENTITY',
            email: `updated${timestamp}@example.com`,
            phone: '+381600000000',
            pib: `10${timestamp}`,
            mbr: `20${timestamp}`,
            account: `160-12345${timestamp % 1000}-12`,
            bank: 'Banca Intesa',
          },
        },
      })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.updateSessionUser).toMatchObject({
      name: `updated${timestamp}`,
      fullName: 'Updated User',
      entityType: 'LEGAL_ENTITY',
      email: `updated${timestamp}@example.com`,
      phone: '+381600000000',
      pib: `10${timestamp}`,
      mbr: `20${timestamp}`,
      account: `160-12345${timestamp % 1000}-12`,
      bank: 'Banca Intesa',
    });
  });
});

describe('GraphQL userInfo Query', () => {
  const createUserMutation = `
    mutation CreateUser($input: CreateUserInput!) {
      createUser(input: $input) {
        id
        email
      }
    }
  `;

  const userInfoQuery = `
    query UserInfo($id: ID, $email: String) {
      userInfo(id: $id, email: $email) {
        id
        name
        fullName
        phone
        email
        bio
        tgId
        passwordHash
        createdAt
        updatedAt
      }
    }
  `;

  it('should return user by email', async () => {
    const timestamp = Date.now();
    const email = `info-email-${timestamp}@example.com`;

    const createResponse = await request(app)
      .post('/graphql')
      .send({
        query: createUserMutation,
        variables: {
          input: {
            name: `userinfo${timestamp}`,
            fullName: 'User Info Email',
            email,
            password: 'password123',
          },
        },
      })
      .set('Content-Type', 'application/json');

    expect(createResponse.status).toBe(200);
    expect(createResponse.body.errors).toBeUndefined();

    const response = await request(app)
      .post('/graphql')
      .send({ query: userInfoQuery, variables: { email } })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.userInfo).toMatchObject({
      email,
      name: `userinfo${timestamp}`,
      fullName: 'User Info Email',
      phone: null,
      bio: null,
      tgId: null,
    });
    expect(response.body.data.userInfo.passwordHash).toBeDefined();
    expect(response.body.data.userInfo.createdAt).toBeDefined();
    expect(response.body.data.userInfo.updatedAt).toBeDefined();
  });

  it('should return user by id', async () => {
    const timestamp = Date.now();
    const email = `info-id-${timestamp}@example.com`;

    const createResponse = await request(app)
      .post('/graphql')
      .send({
        query: createUserMutation,
        variables: {
          input: {
            name: `userinfoid${timestamp}`,
            fullName: 'User Info Id',
            email,
            password: 'password123',
          },
        },
      })
      .set('Content-Type', 'application/json');

    expect(createResponse.status).toBe(200);
    expect(createResponse.body.errors).toBeUndefined();

    const userId = createResponse.body.data.createUser.id;

    const response = await request(app)
      .post('/graphql')
      .send({ query: userInfoQuery, variables: { id: userId } })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.userInfo).toMatchObject({
      id: userId,
      email,
      name: `userinfoid${timestamp}`,
      fullName: 'User Info Id',
      phone: null,
      bio: null,
      tgId: null,
    });
    expect(response.body.data.userInfo.passwordHash).toBeDefined();
    expect(response.body.data.userInfo.createdAt).toBeDefined();
    expect(response.body.data.userInfo.updatedAt).toBeDefined();
  });

  it('should fail when both id and email are provided', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: userInfoQuery,
        variables: {
          id: 'some-id',
          email: 'some@example.com',
        },
      })
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors[0].message).toContain(
      'Provide only one unique identifier: id or email'
    );
  });
});

describe('GraphQL session-backed auth', () => {
  const createUserMutation = `
    mutation CreateUser($input: CreateUserInput!) {
      createUser(input: $input) {
        id
        name
        fullName
        email
      }
    }
  `;

  const loginMutation = `
    mutation Login($email: String!, $password: String!) {
      login(email: $email, password: $password) {
        id
        email
      }
    }
  `;

  const sessionUserQuery = `
    query SessionUser {
      sessionUser {
        id
        email
      }
    }
  `;

  it('restores user via server session when cookie is valid', async () => {
    const timestamp = Date.now();
    const email = `session-${timestamp}@example.com`;
    const password = 'password123';

    await request(app)
      .post('/graphql')
      .send({
        query: createUserMutation,
        variables: {
          input: {
            name: `sessionuser${timestamp}`,
            fullName: 'Session User',
            email,
            password,
          },
        },
      })
      .set('Content-Type', 'application/json');

    const agent = request.agent(app);

    const loginResponse = await agent
      .post('/graphql')
      .send({
        query: loginMutation,
        variables: {
          email,
          password,
        },
      })
      .set('Content-Type', 'application/json');

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.errors).toBeUndefined();

    const sessionResponse = await agent
      .post('/graphql')
      .send({ query: sessionUserQuery })
      .set('Content-Type', 'application/json');

    expect(sessionResponse.status).toBe(200);
    expect(sessionResponse.body.errors).toBeUndefined();
    expect(sessionResponse.body.data.sessionUser).toMatchObject({ email });
  });
});
