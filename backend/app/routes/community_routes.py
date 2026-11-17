import re

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import bearer_scheme, get_current_user
from app.core.exceptions import ResourceNotFoundError
from app.models.community import CommunityAnswer, CommunityPost, PostVote
from app.models.user import User
from app.routes import paths
from app.views.community import (
    CommunityAnswerRequest,
    CommunityAnswerResponse,
    CommunityPostDetailResponse,
    CommunityPostRequest,
    CommunityPostResponse,
    PostVoteRequest,
    PostVoteToggleResponse,
)

_MEDICAL_WARNING_TERMS = re.compile(
    r"\b(?:vomit|bleeding|poison|seizure|unconscious|lethargic)\b", re.IGNORECASE
)

router = APIRouter(
    prefix=paths.COMMUNITY, tags=["Community"], dependencies=[Depends(bearer_scheme)]
)


@router.get("/posts", response_model=list[CommunityPostResponse])
def list_posts(
    category: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[CommunityPost]:
    stmt = select(CommunityPost)
    if category and category.strip():
        stmt = stmt.where(CommunityPost.category == category.strip())
    if search and search.strip():
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            CommunityPost.title.ilike(term) | CommunityPost.content.ilike(term)
        )
    stmt = stmt.order_by(CommunityPost.created_at.desc(), CommunityPost.id.desc())
    return list(db.scalars(stmt))


@router.post(
    "/posts",
    response_model=CommunityPostResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_post(
    data: CommunityPostRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CommunityPost:
    contains_medical_warning_term = bool(
        _MEDICAL_WARNING_TERMS.search(f"{data.title} {data.content}")
    )
    post = CommunityPost(
        user_id=user.id,
        title=data.title,
        content=data.content,
        category=data.category,
        has_medical_warning=data.has_medical_warning or contains_medical_warning_term,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@router.get("/posts/{post_id}", response_model=CommunityPostDetailResponse)
def get_post(
    post_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> dict:
    post = db.get(CommunityPost, post_id)
    if post is None:
        raise ResourceNotFoundError("Community post", post_id)
    answers = db.scalars(
        select(CommunityAnswer)
        .where(CommunityAnswer.post_id == post_id)
        .order_by(CommunityAnswer.created_at.asc(), CommunityAnswer.id.asc())
    )
    return {"post": post, "answers": list(answers)}


@router.post(
    "/posts/{post_id}/answers",
    response_model=CommunityAnswerResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_answer(
    post_id: int,
    data: CommunityAnswerRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CommunityAnswer:
    if db.get(CommunityPost, post_id) is None:
        raise ResourceNotFoundError("Community post", post_id)
    answer = CommunityAnswer(post_id=post_id, user_id=user.id, content=data.content)
    db.add(answer)
    db.commit()
    db.refresh(answer)
    return answer


@router.post(
    "/posts/{post_id}/vote", response_model=PostVoteToggleResponse
)
def toggle_vote(
    post_id: int,
    data: PostVoteRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PostVoteToggleResponse:
    post = db.get(CommunityPost, post_id)
    if post is None:
        raise ResourceNotFoundError("Community post", post_id)

    vote = db.scalar(
        select(PostVote).where(PostVote.post_id == post_id, PostVote.user_id == user.id)
    )
    requested_vote = data.vote_type
    if vote is None:
        db.add(PostVote(post_id=post_id, user_id=user.id, vote_type=requested_vote))
        post.upvotes_count += int(requested_vote == 1)
        resulting_vote = requested_vote
    elif vote.vote_type == requested_vote:
        db.delete(vote)
        post.upvotes_count -= int(vote.vote_type == 1)
        resulting_vote = None
    else:
        post.upvotes_count += int(requested_vote == 1) - int(vote.vote_type == 1)
        vote.vote_type = requested_vote
        resulting_vote = requested_vote

    db.commit()
    return PostVoteToggleResponse(
        post_id=post_id, vote_type=resulting_vote, upvotes_count=post.upvotes_count
    )
