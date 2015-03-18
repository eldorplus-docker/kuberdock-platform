define(['marionette', 'paginator', 'utils'],
       function (Marionette, PageableCollection, utils) {

    var UsersApp = new Marionette.Application({
        regions: {
            contents: '#contents'
        }
    });

    UsersApp.module('Data', function(Data, App, Backbone, Marionette, $, _){

        Data.UserModel = utils.BaseModel.extend({
            urlRoot: '/api/users/'
        });
        Data.UsersCollection = Backbone.Collection.extend({
            url: '/api/users/',
            model: Data.UserModel
        });

        Data.UserActivitiesModel = utils.BaseModel.extend({
            urlRoot: '/api/users/a/:id'
        });

        Data.UsersPageableCollection = PageableCollection.extend({
            url: '/api/users',
            model: Data.UserModel,
            parse: utils.unwrapper,
            mode: 'client',
            state: {
                pageSize: 5
            }
        });

        Data.ActivitiesCollection = PageableCollection.extend({
            url: '/api/users/a/:id',
            model: Data.UserActivitiesModel,
            parse: utils.unwrapper,
            mode: 'client',
            state: {
                pageSize: 15
            }
        });
    });

    UsersApp.module('Views', function(Views, App, Backbone, Marionette, $, _){

        //=================Copy from app.js ====================================
        Views.PaginatorView = Backbone.Marionette.ItemView.extend({
            template: '#paginator-template',
            initialize: function(options) {
                this.model = new Backbone.Model({
                    v: options.view,
                    c: options.view.collection
                });
                this.listenTo(this.model.get('c'), 'remove', function(){
                    this.render();
                });
            },
            events: {
                'click li.pseudo-link' : 'paginateIt'
            },
            paginateIt: function(evt){
                evt.stopPropagation();
                var tgt = $(evt.target);
                if (tgt.hasClass('paginatorFirst')) this.model.get('c').getFirstPage();
                else if (tgt.hasClass('paginatorPrev')) this.model.get('c').getPreviousPage();
                else if (tgt.hasClass('paginatorNext')) this.model.get('c').getNextPage();
                else if (tgt.hasClass('paginatorLast')) this.model.get('c').getLastPage();
                this.render();
            }
        });
        //======================================================================

        Views.UserItem = Backbone.Marionette.ItemView.extend({
            template: '#user-item-template',
            tagName: 'tr',
            className: function(){
                if (this.model.get('checked')) return 'checked';
            },

            ui: {
                'profileUser'   :   'button#profileUser',
                'authIt'        :   'button#authIt'
            },

            events: {
                'click @ui.profileUser' : 'profileUser_btn',
                'click @ui.authIt'      : 'authIt_btn',
                'click'                 : 'checkUser'
            },

            checkUser: function(){
                var models = this.model.collection.models;
                this.model.get('checked') ? this.model.set('checked',false) : this.model.set('checked',true);
           
                this.$el.toggleClass('checked').siblings().removeClass('checked');

                for (var i = 0; i < models.length; i++) {
                    if ( this.model.get('id') == models[i].get('id') ) continue;
                    models[i].unset('checked');
                };
            },

            profileUser_btn: function(){
                App.router.navigate('/profile/' + this.model.id + '/', {trigger: true});
            },

            authIt_btn: function(){
                var that = this;
                utils.modalDialog({
                    title: 'Authorize by user',
                    body: "Are you sure want to authorize by user '" +
                        this.model.get('username') + "'?",
                    small: true,
                    show: true,
                    footer: {
                        buttonOk: function(){
                            $.ajax({
                                url: '/api/users/loginA',
                                type: 'POST',
                                data: {user_id: that.model.id},
                                dataType: 'JSON',
                                success: function(rs){
                                    if(rs.status == 'OK')
                                        window.location.href = '/';
                                }
                            });
                        },
                        buttonCancel: true
                    }
                });
            }

        });

        Views.OnlineUserItem = Marionette.ItemView.extend({
            template: '#online-user-item-template',
            tagName: 'tr',
            ui: { 
                'userActivityHistory' : "button#userActivityHistory"
            },

            events: {
                'click @ui.userActivityHistory' : 'userActivityHistory_btn'
            },

            userActivityHistory_btn: function(){
                App.router.navigate('/online/' + this.model.id + '/', {trigger: true});
            }
        });

        Views.ActivityItem = Marionette.ItemView.extend({
            template: '#activity-item-template',
            tagName: 'tr'
        });

        Views.UsersListView = Backbone.Marionette.CompositeView.extend({
            template: '#users-list-template',
            childView: Views.UserItem,
            childViewContainer: "tbody",

            ui: {
                'add_user'               : 'button#add_user',
                'control'                : 'div.active-item-control',
                'thead'                  : 'thead',
                'remove_selected_user'   : 'button#deleteUser',
                'edit_selected_user'     : 'span#editUser',
                'block_selected_user'    : 'button#blockUser',
                'activate_selected_user' : 'button#activeteUser'
            },

            events: {
                'click tbody tr'                   : 'activeMenu',
                'click @ui.add_user'               : 'addUser',
                'click @ui.remove_selected_user'   : 'removeSelectedUser',
                'click @ui.edit_selected_user'     : 'editSelectedUser',
                'click @ui.block_selected_user'    : 'blockSelectedUser',
                'click @ui.activate_selected_user' : 'activateSelectedUser'
            },

            activeMenu: function(){
                var models = this.collection.models;

                for (var i = 0; i < models.length; i++) {
                    if ( models[i].get('checked') ) {
                        var name = models[i].attributes.username;
                        
                        this.ui.control.show();
                        this.ui.thead.addClass('min-opacity');
                        this.ui.edit_selected_user.text(name);
                        break;
                    } else {
                        this.ui.control.hide();
                        this.ui.thead.removeClass('min-opacity');
                    }
                };
            },

            editSelectedUser: function(e){
                var models = this.collection.models;
               
                for (var i = 0; i < models.length; i++) {
                    if (models[i].get('checked')){
                        App.router.navigate('/edit/' + models[i].id + '/', {trigger: true});
                        break;
                    }
                }    
                e.stopPropagation();      
            },

            blockSelectedUser: function(e){
                var models = this.collection.models;
               
                for (var i = 0; i < models.length; i++) {
                    if (models[i].get('checked')){
                        models[i].set('active',false);
                        break;
                    }
                }    
                e.stopPropagation();     
            },

            activateSelectedUser: function(e){
                var models = this.collection.models;
               
                for (var i = 0; i < models.length; i++) {
                    if (models[i].get('checked')){
                        models[i].set('active',true);
                        break;
                    }
                }    
                e.stopPropagation();  
            },

            removeSelectedUser: function(e){
                var models = this.collection.models;
               
                for (var i = 0; i < models.length; i++) {
                    if (models[i].get('checked')){
                        models[i].destroy();
                        break;
                    }
                }    
                e.stopPropagation();      
            },

            addUser: function(){
                App.router.navigate('/create/', {trigger: true});
            }
        });

        Views.OnlineUsersListView = Marionette.CompositeView.extend({
            template: '#online-users-list-template',
            childView: Views.OnlineUserItem,
            childViewContainer: "tbody"
        });

        Views.UsersActivityView = Marionette.CompositeView.extend({
            template: '#users-activities-template',
            childView: Views.ActivityItem,
            childViewContainer: "tbody"
        });

        Views.AllUsersActivitiesView = Backbone.Marionette.ItemView.extend({
            template: '#all-users-activities-template',

            ui: {
                'dateFrom'  : 'input#dateFrom',
                'dateTo'    : 'input#dateTo',
                'usersList' : 'ul#users-list',
                'tbody'     : '#users-activities-table'
            },

            events: {
                'change input.user-activity' : 'getUsersActivities',
                'change input#dateFrom'      : 'getUsersActivities',
                'change input#dateTo'        : 'getUsersActivities'
            },

            onRender: function(){
                var that = this;
                console.log(usersCollection);
                // Make users list
                $.each(usersCollection, function(i, user){
                    that.ui.usersList.append(
                        '<li><label><input type="checkbox" name="uachb" value="' +
                            user.id + '" class="user-activity"/> ' +
                            user.username + '</label></li>'
                    );
                });
                // Init datepicker
                this.ui.dateFrom.datepicker({dateFormat: "yy-mm-dd"});
                this.ui.dateTo.datepicker({dateFormat: "yy-mm-dd"});
                // Set default date
                var now = utils.dateYYYYMMDD();
                this.ui.dateFrom.val(now);
                this.ui.dateTo.val(now);
            },

            getUsersActivities: function(){
                var that = this,
                    users = [];
                that.ui.tbody.empty();
                $('.user-activity').each(function(i, el){
                    if($(el).is(':checked')) users.push(parseInt($(el).val()));
                });
                if(users.length == 0) {
                    return false;
                }
                $.ajax({
                    url: '/api/users/activities',
                    data: {date_from: this.ui.dateFrom.val(),
                           date_to: this.ui.dateTo.val(),
                           users_ids: users.join(',')},
                    dataType: 'JSON',
                    type: 'POST',
                    success: function(rs){
                        if(rs.data){
                            if(rs.data.length == 0){
                                that.ui.tbody.append($('<tr>').append(
                                    '<td colspan="5" align="center">Nothing found</td>'
                                ));
                            } else {
                                $.each(rs.data, function (i, itm) {
                                    that.ui.tbody.append($('<tr>').append(
                                        '<td>' + itm.user.username + '</td>' +
                                        '<td>' + itm.user.email + '</td>' +
                                        '<td>' + itm.user.rolename + '</td>' +
                                        '<td>' + itm.user.active + '</td>' +
                                        '<td>' + itm.ts + '</td>'
                                    ));
                                })
                            }
                        }
                    }
                })
            }
        });

        Views.UserCreateView = Backbone.Marionette.ItemView.extend({
            template: '#user-create-template',
            tagName: 'div',

            ui: {
                'username'        : 'input#username',
                'password'        : 'input#password',
                'password_again'  : 'input#password-again',
                'email'           : 'input#email',
                'user_status'     : 'select#status-select',
                'role_select'     : 'select#role-select',
                'users_page'      : 'div#users-page',
                'user_add_btn'    : 'button#user-add-btn',
                'user_cancel_btn' : 'button#user-cancel-btn'
            },

            events: {
                'click @ui.users_page'      : 'breadcrumbClick',
                'click @ui.user_add_btn'    : 'onSave',
                'click @ui.user_cancel_btn' : 'cancel'
            },

            onSave: function(){
                // temp validation
                if (!this.ui.password.val() || (this.ui.password.val() !== this.ui.password_again.val())) {
                    // set error messages to password fields
                    this.ui.password.notify("empty password or don't match");
                    return false
                }

                App.Data.users.create({
                    'username' : this.ui.username.val(),
                    'password' : this.ui.password.val(),
                    'email'    : this.ui.email.val(),
                    'active'   : (this.ui.user_status.val() == 1 ? true : false),
                    'rolename' : this.ui.role_select.val()
                }, {
                    wait: true,
                    success: function(){
                        App.router.navigate('/', {trigger: true})
                    }
                });
            },

            cancel: function(){
               App.router.navigate('/', {trigger: true});
            },

            breadcrumbClick: function(){
               App.router.navigate('/', {trigger: true});
            }

        });

        Views.UserProfileView = Backbone.Marionette.ItemView.extend({
            template: '#user-profile-template',
            tagName: 'div',
            

            ui: {
                'users_page'          : 'div#users-page',
                'delete_user_btn'     : 'button#delete_user',
                'user_cancel_btn'     : 'button#user-cancel-btn',
                'login_this_user_btn' : 'button#login_this_user'
            },
            events: {
                'click @ui.users_page'          : 'breadcrumbClick',
                'click @ui.user_cancel_btn'     : 'cancel',
                'click @ui.delete_user_btn'     : 'delete_user',
                'click @ui.login_this_user_btn' : 'login_this_user'
            },

            login_this_user: function(){
               alert('Login this user event');
            },

            delete_user: function(){
               alert('Delete User Event');
            },

            cancel: function(){
               App.router.navigate('/', {trigger: true});
            },

            breadcrumbClick: function(){
               App.router.navigate('/', {trigger: true});
            }

        });

        Views.UsersEditView = Views.UserCreateView.extend({     // inherit

            onRender: function(){
                this.ui.username.val(this.model.get('username'));
                this.ui.email.val(this.model.get('email'));
                this.ui.user_status.val((this.model.get('active') == true ? 1 : 0));
                this.ui.role_select.val(this.model.get('rolename'));
            },

            onSave: function(){
                // temp validation
                var data = {
                    'username' : this.ui.username.val(),
                    'email'    : this.ui.email.val(),
                    'active'   : (this.ui.user_status.val() == 1 ? true : false),
                    'rolename' : this.ui.role_select.val()
                };
                if(this.ui.password.val()){
                    if (!this.ui.password.val() || (this.ui.password.val() !== this.ui.password_again.val())) {
                        // set error messages to password fields
                        this.ui.password.notify("empty password or don't match");
                        return false;
                    }
                    data['password'] = this.ui.password.val();
                }
                if(!data.email){
                    this.ui.email.notify('E-mail is required');
                    this.ui.email.focus();
                    return false;
                }
                if(!data.username){
                    this.ui.username.notify('Username is required');
                    this.ui.username.focus();
                    return false;
                }
                if(!data.rolename){
                    this.ui.role_select.notify('Username is required');
                    this.ui.role_select.focus();
                    return false;
                }
                this.model.set(data);

                this.model.save(undefined, {
                    wait: true,
                    success: function(){
                        App.router.navigate('/', {trigger: true})
                    }
                });
            }

        });

        Views.UsersLayout = Marionette.LayoutView.extend({
            template: '#users-layout-template',
            regions: {
                main: 'div#main',
                pager: 'div#pager'
            }
        });
    });


    UsersApp.module('UsersCRUD', function(UsersCRUD, App, Backbone, Marionette, $, _){

        UsersCRUD.Controller = Marionette.Controller.extend({
            showOnlineUsers: function(){
                var layout_view = new App.Views.UsersLayout();
                var online_users_list_view = new App.Views.OnlineUsersListView({
                    collection: App.Data.onlineUsers});
                var user_list_pager = new App.Views.PaginatorView({
                    view: online_users_list_view});
                this.listenTo(layout_view, 'show', function(){
                    layout_view.main.show(online_users_list_view);
                    layout_view.pager.show(user_list_pager);
                });
                App.contents.show(layout_view);
            },
            showUserActivity: function(user_id){
                var layout_view = new App.Views.UsersLayout(),
                    t = this;
                $.ajax({
                    'url': '/api/users/a/' + user_id,
                    success: function(rs){
                        UsersApp.Data.activities = new UsersApp.Data.ActivitiesCollection(rs.data);
                        var activities_view = new App.Views.UsersActivityView({
                            collection: UsersApp.Data.activities});
                        var activities_list_pager = new App.Views.PaginatorView({
                            view: activities_view});
                        t.listenTo(layout_view, 'show', function(){
                            layout_view.main.show(activities_view);
                            layout_view.pager.show(activities_list_pager);
                        });
                        App.contents.show(layout_view);
                    }
                });
            },
            showUsers: function(){
                var layout_view = new App.Views.UsersLayout();
                var users_list_view = new App.Views.UsersListView({
                    collection: UsersApp.Data.users});
                var user_list_pager = new App.Views.PaginatorView({
                    view: users_list_view});
                this.listenTo(layout_view, 'show', function(){
                    layout_view.main.show(users_list_view);
                    layout_view.pager.show(user_list_pager);
                });
                App.contents.show(layout_view);
            },

            showAllUsersActivity: function(){
                var layout_view = new App.Views.UsersLayout();
                var users_activities_view = new App.Views.AllUsersActivitiesView();
                this.listenTo(layout_view, 'show', function(){
                    layout_view.main.show(users_activities_view);
                });
                App.contents.show(layout_view);
            },

            showCreateUser: function(){
                var layout_view = new App.Views.UsersLayout();
                var user_create_view = new App.Views.UserCreateView();

                this.listenTo(layout_view, 'show', function(){
                    layout_view.main.show(user_create_view);
                });

                App.contents.show(layout_view);
            },

            showEditUser: function(user_id){
                var layout_view = new App.Views.UsersLayout();
                var user_edit_view = new App.Views.UsersEditView({
                    model: App.Data.users.get(parseInt(user_id))
                });
                this.listenTo(layout_view, 'show', function () {
                    layout_view.main.show(user_edit_view);
                    $('#pager').hide();
                    $('#user-header h2').text('Edit');

                });
                App.contents.show(layout_view);
            },

            showProfileUser: function(user_id){
                var layout_view = new App.Views.UsersLayout();
                var user_profile_view = new App.Views.UserProfileView({
                    model: App.Data.users.get(parseInt(user_id))
                });

                this.listenTo(layout_view, 'show', function () {
                    layout_view.main.show(user_profile_view);
                });
                App.contents.show(layout_view);
            }
        });

        UsersCRUD.addInitializer(function(){
            var controller = new UsersCRUD.Controller();
            App.router = new Marionette.AppRouter({
                controller: controller,
                appRoutes: {
                    'online/'      : 'showOnlineUsers',
                    'online/:id/'  : 'showUserActivity',
                    ''             : 'showUsers',
                    'create/'      : 'showCreateUser',
                    'edit/:id/'    : 'showEditUser',
                    'profile/:id/' : 'showProfileUser',
                    'activity/'    : 'showAllUsersActivity'
                }
            });
        });

    });

    UsersApp.on('start', function(){
        if (Backbone.history) {
            Backbone.history.start({root: '/users', pushState: true});
        }
    });
    return UsersApp;
});