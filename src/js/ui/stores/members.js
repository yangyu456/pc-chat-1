
import { observable, action } from 'mobx';
import pinyin from './../han';
import axios from 'axios';

import helper from 'utils/helper';
import GroupInfo from '../../wfc/model/groupInfo';
import UserInfo from '../../wfc/model/userInfo';
import wfc from '../../wfc/client/wfc'
import Config from '../../config'

class Members {
    @observable show = false;
    // 可能是groupInfo，或者channelInfo
    @observable target;
    @observable list = [];
    @observable filtered = [];
    @observable query = '';
    @observable groupNotice = '';

    @action async toggle(show = self.show, target = self.target) {
        let userIds = [];
        let users = [];
        async function getGroupNotice() {
            var response = await axios.post('/get_group_announcement', {
                token: WildFireIM.config.token,
                groupId: target.target
            });
            if (response.data && response.data.result) {
                self.groupNotice =  response.data.result.text 
            }else{
                self.groupNotice ='';
            }
        }
        if (target instanceof GroupInfo) { 
            let members = wfc.getGroupMembers(target.target);
            members.forEach(m => {
                userIds.push(m.memberId);
            });
            users = wfc.getUserInfos(userIds, target);
            axios.defaults.baseURL = Config.APP_SERVER;
            getGroupNotice();

        } else if (target instanceof UserInfo) {
            self.show = show;
            self.target = target;
            return;
        }

        var list = [];
        self.show = show;
        self.target = target;

        if (show === false) {
            self.query = '';
            self.filtered.replace([]);
            return;
        }

        self.list.replace(users);

        Promise.all(
            users.map(async e => {
                var pallet = e.pallet;

                if (!pallet) {
                    e.pallet = await helper.getPallet(e.portrait);
                }
                list.push(e);
            })
        ).then(() => {
            self.list.replace(list);
        });


    }

    @action search(text = '') {
        var list;

        self.query = text;

        if (text) {
            list = self.list.filter(e => {
                return pinyin.letter(wfc.getGroupMemberDisplayName(self.target.target, e.uid), '', null).toLowerCase().indexOf(pinyin.letter(text.toLocaleLowerCase(), '', null)) > -1;
            });
            self.filtered.replace(list);

            return;
        }

        self.filtered.replace([]);
    }
}

const self = new Members();
export default self;
