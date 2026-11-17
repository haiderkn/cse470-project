from datetime import datetime
from typing import Literal

from pydantic import Field

from app.views.auth import CamelModel


class CommunityPostRequest(CamelModel):
    title: str = Field(min_length=1, max_length=255)
    content: str = Field(min_length=1)
    category: str = Field(min_length=1, max_length=100)
    has_medical_warning: bool = False


class CommunityPostResponse(CamelModel):
    id: int
    user_id: int
    title: str
    content: str
    category: str
    upvotes_count: int
    has_medical_warning: bool
    created_at: datetime


class CommunityAnswerResponse(CamelModel):
    id: int
    post_id: int
    user_id: int
    content: str
    upvotes_count: int
    created_at: datetime


class CommunityPostDetailResponse(CamelModel):
    post: CommunityPostResponse
    answers: list[CommunityAnswerResponse]


class CommunityAnswerRequest(CamelModel):
    content: str = Field(min_length=1)


class PostVoteRequest(CamelModel):
    vote_type: Literal[-1, 1]


class PostVoteToggleResponse(CamelModel):
    post_id: int
    vote_type: Literal[-1, 1] | None
    upvotes_count: int
