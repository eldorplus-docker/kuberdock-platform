from datetime import datetime
from hashlib import sha1

from ..core import db
from ..models_mixin import BaseModelMixin


class PredefinedApp(BaseModelMixin, db.Model):
    __tablename__ = 'predefined_apps'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True, nullable=False)
    name = db.Column(db.String(255), default='', nullable=False)
    qualifier = db.Column(db.String(40), default='', nullable=False, index=True)
    template = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    def __repr__(self):
        return ("<PredefinedApp(id={0}, name='{1}', qualifier='{2}', "
                "user_id={3})>".format(self.id, self.name, self.qualifier,
                                       self.user_id))

    def save(self):
        if not self.qualifier:
            sha = sha1()
            sha.update(str(datetime.now()))
            self.qualifier = sha.hexdigest()
        super(PredefinedApp, self).save()

    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'qualifier': self.qualifier,
                'template': self.template, 'user_id': self.user_id}
