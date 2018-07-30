var _gained = () => {

  var gained = [];

  return {

    receive: (data) => {
      var skill = data.skill;
      var start = data.start;
      var level = data.level;
      var name = data.name;
      var lGained = level - start;
      var session = lGained;
      if (gained[skill])
        session += gained[skill];
      gained[skill] = session;
      sendNotificationWithOptions({
        icon: `http://cryogen.live/images/skill_hd/${skill}.png`,
        title: `${name} - ${lGained} level${(lGained > 1 ? 's' : '')} gained!`,
        body: `You are now level ${level}. ${session} level${(session > 1 ? 's' : '')} gained this session.`
      });
    }

  };

};
module.exports = _gained;