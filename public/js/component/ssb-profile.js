
function getUserPosts(opts,callback){
  var opts = opts || {};
  var id = opts.id;
  if (!opts.id){
    return callback(new Error('missing an ID to get posts for'))
  }

  var count = opts.count || 20;
  var start = opts.start || Infinity;

  fetch(`/userPosts?count=${count}&start=${start}&id=${encodeURIComponent(id)}`).then(response=>{
    return response.json()
  }).then(posts=>{
    callback(null,posts);
  }).catch(e=>{
    console.error(e);
    callback(e);
  })
}

var ssbProfile = Vue.component('ssb-profile',{
  data:function(){
    return {
      cacheBus:window.cacheBus,
      id:'',
      posts:[],
      cursor:Infinity,
      author:{}
    }
  },
  template:`
    <post-list :more="more" :posts="posts" :refresh="refresh">
      <div class="box post">
          <article class="media">
            <a class="media-left">
              <ssb-avatar large :src=" author.image?hrefForBlobAddress(author.image):'https://bulma.io/images/placeholders/128x128.png' "></ssb-avatar>
            </a>
            <div class="media-content">
              <div class="content">
                <h1>{{author.name}}</h1>
                <p>
                  <span v-if="author.isFriend">&nbsp;<span class="tag is-success">Following</span>&nbsp;</span>
                  <a>{{id}}</a>
                </p>
                <p v-if="author.description" v-html="author.description"></p>
              </div>
            </div>
          </article>

      </div>

    </post-list>
  `,
  methods:{
    more(cb){
      getUserPosts({id:this.id,start:this.cursor},(er,data)=>{
        if(er){cb(er);}
        data.forEach(p=>{
          this.cursor = Math.min(p.sequence,this.cursor)
          this.posts.push(p)
        })
        cb(null,data);
      });
    },
    refresh(cb){
      getUserPosts({id:this.id},(er,data)=>{
        if(er){cb(er);}
        this.posts=[];
        data.forEach(p=>{
          this.cursor = Math.min(p.sequence,this.cursor)
          this.posts.push(p)
        })
        cb(null,data);
      });
    },
    hrefForBlobAddress(addr){
      return window.hrefForBlobAddress(addr);
    }
  },
  created(){
    if(this.$route && this.$route.params.id){
      this.id = this.$route.params.id

      // fetch author info
      if (this.cacheBus.authors[this.id]){
        this.author = this.cacheBus.authors[this.id];
        return;
      }
      this.cacheBus.$emit('requestAuthor',this.id);
      var v = this;
      this.cacheBus.$on('gotAuthor:'+this.id,function(a){
        v.$forceUpdate();
        v.author = a;
      });
    }else{
      return console.error('missing an id , ruhroh raggy')
    }

  }
});