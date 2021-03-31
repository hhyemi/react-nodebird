// 코드의 중복을 줄이기 위한 custom middleware
exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next(); // next안에 인자를 넣으면 error처리하게되고 그냥 next()는 다음 미들웨어로 감
  } else {
    res.status(401).send('로그인이 필요합니다.');
  }
};

exports.isNotLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    next();
  } else {
    res.status(401).send('로그인하지 않은 사용자만 접근 가능합니다.');
  }
};
