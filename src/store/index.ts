import { createStore, Commit } from 'vuex'
import axios, { AxiosRequestConfig } from 'axios'
import { arrToObj, objToArr } from '../helper'

export interface ResponseType<P = Record<string, never>> {
  code: number
  msg: string
  data: P
}
export interface ImageProps {
  _id?: string
  url?: string
  createdAt?: string
  fitUrl?: string
}
export interface UserProps {
  isLogin: boolean
  nickName?: string
  _id?: string
  column?: string
  email?: string
  avatar?: ImageProps
  description?: string
}
export interface ColumnProps {
  _id: string
  title: string
  avatar?: ImageProps
  description: string
}
export interface PostProps {
  _id?: string
  title: string
  excerpt?: string
  content?: string
  image?: ImageProps | string
  createdAt?: string
  column: string
  author?: string | UserProps
}
interface ListProps<P> {
  [id: string]: P
}
export interface GlobalErrorProps {
  status: boolean
  message?: string
}
export interface GlobalDataProps {
  token: string
  error: GlobalErrorProps
  loading: boolean
  columns: ListProps<ColumnProps>
  posts: ListProps<PostProps>
  user: UserProps
}

const getAndCommit = async (url: string, mutationName: string, commit: Commit) => {
  const { data } = await axios.get(url)
  commit(mutationName, data)
  return data
}

const postAndCommit = async (url: string, mutationName: string, commit: Commit, payload: any) => {
  const { data } = await axios.post(url, payload)
  commit(mutationName, data)
  return data
}

const asyncAndCommit = async (
  url: string,
  mutationName: string,
  commit: Commit,
  config: AxiosRequestConfig = { method: 'get' }
) => {
  const { data } = await axios(url, config)
  commit(mutationName, data)
  return data
}

export default createStore<GlobalDataProps>({
  state: {
    error: { status: false },
    token: localStorage.getItem('token') || '',
    loading: false,
    columns: {},
    posts: {},
    user: {
      isLogin: false
    }
  },
  mutations: {
    createPost(state, newPost) {
      state.posts[newPost._id] = newPost
    },
    fetchColumns(state, rawData) {
      state.columns = arrToObj(rawData.data.list)
    },
    fetchColumn(state, rawData) {
      state.columns[rawData.data._id] = rawData.data
    },
    fetchPosts(state, rawData) {
      state.posts = arrToObj(rawData.data.list)
    },
    fetchPost(state, rawData) {
      state.posts[rawData.data._id] = rawData.data
    },
    setLoading(state, status) {
      state.loading = status
    },
    setError(state, e: GlobalErrorProps) {
      state.error = e
    },
    login(state, rawData) {
      const { token } = rawData.data
      state.token = token
      localStorage.setItem('token', token)
      axios.defaults.headers.common.Authorization = `Bearer ${token}`
    },
    fetchCurrentUser(state, rawData) {
      state.user = {
        isLogin: true,
        ...rawData.data
      }
    },
    signOut(state) {
      state.token = ''
      localStorage.removeItem('token')
      state.user = {
        isLogin: false
      }
      delete axios.defaults.headers.common.Authorization
    },
    updatePost(state, { data }) {
      state.posts[data._id] = data
    },
    deletePost(state, { data }) {
      delete state.posts[data._id]
    }
  },
  actions: {
    fetchColumns({ commit }, data) {
      return getAndCommit(`/columns?currentPage=${data.page}&pageSize=${data.size}`, 'fetchColumns', commit)
    },
    fetchColumn({ commit }, cid) {
      return getAndCommit(`/columns/${cid}`, 'fetchColumn', commit)
    },
    fetchPosts({ commit }, cid) {
      return getAndCommit(`/columns/${cid}/posts`, 'fetchPosts', commit)
    },
    fetchPost({ commit }, id) {
      return getAndCommit(`/posts/${id}`, 'fetchPost', commit)
    },
    fetchCurrentUser({ commit }) {
      return getAndCommit('/user/current', 'fetchCurrentUser', commit)
    },
    login({ commit }, payload) {
      return postAndCommit('/user/login', 'login', commit, payload)
    },
    loginAndFetch({ dispatch }, loginData) {
      return dispatch('login', loginData).then(() => {
        return dispatch('fetchCurrentUser')
      })
    },
    createPost({ commit }, payload) {
      return asyncAndCommit('/posts', 'createPost', commit, { method: 'post', data: payload })
    },
    updatePost({ commit }, { id, payload }) {
      return asyncAndCommit(`/posts/${id}`, 'updatePost', commit, { method: 'patch', data: payload })
    },
    deletePost({ commit }, id) {
      return asyncAndCommit(`/posts/${id}`, 'deletePost', commit, { method: 'delete' })
    }
  },
  modules: {},
  getters: {
    getColumns: state => {
      return objToArr(state.columns)
    },
    getColumnById: state => (id: string) => {
      return state.columns[id]
    },
    getPostsByCid: state => (cid: string) => {
      return objToArr(state.posts).filter(post => post.column === cid)
    },
    getCurrentPost: state => (id: string) => {
      return state.posts[id]
    }
  }
})
