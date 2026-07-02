const asyncHandler = require('../utils/asyncHandler');
const { register, login, getCurrentUser } = require('../services/authService');

const registerUser = asyncHandler(async (req, res) => {
  const result = await register(req.validated.body);

  res.status(201).json({
    success: true,
    data: {
      user: result.user,
      organization: result.organization,
      accessToken: result.accessToken
    }
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const result = await login(req.validated.body);

  res.status(200).json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.accessToken
    }
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await getCurrentUser(req.user.id);

  res.status(200).json({
    success: true,
    data: { user }
  });
});

module.exports = {
  registerUser,
  loginUser,
  me
};
